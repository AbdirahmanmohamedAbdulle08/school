const asyncHandler = require('../middleware/asyncHandler');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const isOwnerLike = (user) => user?.roles?.some(role => {
    const name = String(role?.name || '').toLowerCase();
    return name.includes('owner') || name.includes('admin') || name.includes('super') || name.includes('system');
});

const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const [inHour, inMinute] = checkIn.split(':').map(Number);
    const [outHour, outMinute] = checkOut.split(':').map(Number);
    if ([inHour, inMinute, outHour, outMinute].some(Number.isNaN)) return 0;
    let start = inHour * 60 + inMinute;
    let end = outHour * 60 + outMinute;
    if (end < start) end += 24 * 60;
    return Number(((end - start) / 60).toFixed(2));
};

const ensureAttendanceAccess = (req, attendance) => {
    if (!isOwnerLike(req.user) && req.user?.warehouseId && attendance.warehouseId.toString() !== req.user.warehouseId.toString()) {
        const error = new Error('You can only manage attendance in your warehouse.');
        error.statusCode = 403;
        throw error;
    }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
    const query = { };

    if (req.query.date) {
        query.date = req.query.date;
    }

    if (!isOwnerLike(req.user) && req.user?.warehouseId) {
        query.warehouseId = req.user.warehouseId;
    } else if (req.query.warehouseId) {
        query.warehouseId = req.query.warehouseId;
    }

    if (req.query.employeeId) query.employeeId = req.query.employeeId;
    if (req.query.status) query.status = req.query.status;

    const attendance = await Attendance.find(query)
        .populate('employeeId', 'name employeeCode jobTitle department warehouseId status')
        .populate('warehouseId', 'name')
        .populate('recordedBy', 'name username')
        .sort({ date: -1, checkIn: 1 });

    res.json(attendance);
});

// @desc    Mark attendance (Check-in/Check-out wrapper)
// @route   POST /api/attendance
// @access  Private
const markAttendance = asyncHandler(async (req, res) => {
    const { employeeId, date, checkInTime, checkOutTime, status, notes, shift } = req.body;

    if (!employeeId || !date || !status) {
        res.status(400);
        throw new Error('Employee, date, and status are required.');
    }

    // Check if record exists for this employee on this date
    let attendance = await Attendance.findOne({
        
        employeeId,
        date
    });

    // Lookup employee to get warehouseId if creating new
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }
    if (!isOwnerLike(req.user) && req.user?.warehouseId && employee.warehouseId.toString() !== req.user.warehouseId.toString()) {
        res.status(403);
        throw new Error('You can only mark attendance for employees in your warehouse.');
    }

    if (attendance) {
        ensureAttendanceAccess(req, attendance);
        // Update existing
        attendance.checkIn = checkInTime ?? attendance.checkIn;
        attendance.checkOut = checkOutTime ?? attendance.checkOut;
        attendance.shift = shift || attendance.shift;
        attendance.status = status || attendance.status;
        attendance.notes = notes ?? attendance.notes;
        attendance.workHours = calculateHours(attendance.checkIn, attendance.checkOut);
        attendance.recordedBy = req.user._id;
        await attendance.save();
    } else {
        // Create new
        attendance = await Attendance.create({
            warehouseId: employee.warehouseId, // Use employee's warehouse
            employeeId,
            date,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            shift: shift || 'Morning',
            workHours: calculateHours(checkInTime, checkOutTime),
            status: status || 'Present',
            notes,
            recordedBy: req.user._id
        });
    }

    const populated = await Attendance.findById(attendance._id)
        .populate('employeeId', 'name employeeCode jobTitle department warehouseId status')
        .populate('warehouseId', 'name')
        .populate('recordedBy', 'name username');

    res.status(201).json(populated);
});

const updateAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
        res.status(404);
        throw new Error('Attendance record not found');
    }
    ensureAttendanceAccess(req, attendance);

    const { checkInTime, checkOutTime, shift, status, notes } = req.body;
    attendance.checkIn = checkInTime ?? attendance.checkIn;
    attendance.checkOut = checkOutTime ?? attendance.checkOut;
    attendance.shift = shift || attendance.shift;
    attendance.status = status || attendance.status;
    attendance.notes = notes ?? attendance.notes;
    attendance.workHours = calculateHours(attendance.checkIn, attendance.checkOut);
    attendance.recordedBy = req.user._id;
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
        .populate('employeeId', 'name employeeCode jobTitle department warehouseId status')
        .populate('warehouseId', 'name')
        .populate('recordedBy', 'name username');

    res.json(populated);
});

const deleteAttendance = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
        res.status(404);
        throw new Error('Attendance record not found');
    }
    ensureAttendanceAccess(req, attendance);
    await attendance.deleteOne();
    res.json({ message: 'Attendance record removed' });
});

module.exports = {
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance
};
