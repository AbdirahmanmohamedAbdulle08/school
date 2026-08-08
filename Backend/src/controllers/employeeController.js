const asyncHandler = require('../middleware/asyncHandler');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');

const isOwnerLike = (user) => user?.roles?.some(role => {
    const name = String(role?.name || '').toLowerCase();
    return name.includes('owner') || name.includes('admin') || name.includes('super') || name.includes('system');
});

const resolveWarehouseId = (req) => {
    if (!isOwnerLike(req.user) && req.user?.warehouseId) return req.user.warehouseId;
    return req.body.warehouseId || req.body.warehouse || req.query.warehouseId || req.user?.warehouseId;
};

const generateEmployeeCode = async () => {
    const year = new Date().getFullYear();
    const count = await Employee.countDocuments({ createdAt: { $gte: new Date(`${year}-01-01`) } });
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = asyncHandler(async (req, res) => {
    const query = { };

    if (!isOwnerLike(req.user) && req.user?.warehouseId) {
        query.warehouseId = req.user.warehouseId;
    } else if (req.query.warehouseId) {
        query.warehouseId = req.query.warehouseId;
    }

    if (req.query.status) {
        query.status = req.query.status;
    }

    const employees = await Employee.find(query).populate('warehouseId', 'name').sort({ createdAt: -1 }).lean();
    const employeeIds = employees.map(employee => employee._id);

    const [attendanceCounts, taskCounts] = await Promise.all([
        Attendance.aggregate([
            { $match: { employeeId: { $in: employeeIds } } },
            { $group: { _id: '$employeeId', total: { $sum: 1 } } }
        ]),
        Task.aggregate([
            { $match: { assignedTo: { $in: employeeIds } } },
            {
                $group: {
                    _id: '$assignedTo',
                    total: { $sum: 1 },
                    open: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['Pending', 'In Progress']] }, 1, 0]
                        }
                    },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0]
                        }
                    }
                }
            }
        ])
    ]);

    const attendanceByEmployee = new Map(attendanceCounts.map(item => [item._id.toString(), item.total]));
    const taskByEmployee = new Map(taskCounts.map(item => [item._id.toString(), item]));

    res.json(employees.map(employee => {
        const taskStats = taskByEmployee.get(employee._id.toString()) || {};
        return {
            ...employee,
            attendanceRecords: attendanceByEmployee.get(employee._id.toString()) || 0,
            taskStats: {
                total: taskStats.total || 0,
                open: taskStats.open || 0,
                completed: taskStats.completed || 0
            }
        };
    }));
});

// @desc    Create employee
// @route   POST /api/employees
// @access  Private
const createEmployee = asyncHandler(async (req, res) => {
    const {
        name, phone, email, address, department, jobTitle,
        warehouse, joinDate, status, salaryType, salaryAmount,
        payDay, hasSystemAccess, employeeCode, emergencyContact, notes
    } = req.body;

    const warehouseId = resolveWarehouseId(req);
    if (!warehouseId) {
        res.status(400);
        throw new Error('Warehouse is required for employee records.');
    }

    const finalEmployeeCode = employeeCode || await generateEmployeeCode();
    const codeExists = await Employee.findOne({ employeeCode: finalEmployeeCode });
    if (codeExists) {
        res.status(400);
        throw new Error('Employee code already exists.');
    }

    const employee = await Employee.create({
        warehouseId,
        employeeCode: finalEmployeeCode,
        name,
        phone,
        email,
        address,
        emergencyContact,
        department,
        jobTitle,
        joinDate,
        status,
        salaryType,
        salaryAmount,
        payDay,
        hasSystemAccess,
        notes
    });

    res.status(201).json(employee);
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.findOne({ _id: req.params.id, });

    if (employee) {
        if (!isOwnerLike(req.user) && req.user?.warehouseId && employee.warehouseId.toString() !== req.user.warehouseId.toString()) {
            res.status(403);
            throw new Error('You can only update employees in your warehouse.');
        }

        const {
            name, phone, email, address, department, jobTitle,
            status, salaryType, salaryAmount, payDay, warehouseId,
            employeeCode, emergencyContact, notes, hasSystemAccess
        } = req.body;

        if (employeeCode && employeeCode !== employee.employeeCode) {
            const codeExists = await Employee.findOne({ employeeCode, _id: { $ne: employee._id } });
            if (codeExists) {
                res.status(400);
                throw new Error('Employee code already exists.');
            }
            employee.employeeCode = employeeCode;
        }

        employee.name = name || employee.name;
        employee.phone = phone || employee.phone;
        employee.email = email ?? employee.email;
        employee.address = address ?? employee.address;
        employee.emergencyContact = emergencyContact ?? employee.emergencyContact;
        employee.department = department || employee.department;
        employee.jobTitle = jobTitle || employee.jobTitle;
        if (warehouseId && isOwnerLike(req.user)) employee.warehouseId = warehouseId;
        employee.status = status || employee.status;
        employee.salaryType = salaryType || employee.salaryType;
        employee.salaryAmount = salaryAmount ?? employee.salaryAmount;
        employee.payDay = payDay ?? employee.payDay;
        employee.hasSystemAccess = hasSystemAccess ?? employee.hasSystemAccess;
        employee.notes = notes ?? employee.notes;

        const updatedEmployee = await employee.save();
        res.json(updatedEmployee);
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = asyncHandler(async (req, res) => {
    const employee = await Employee.findOne({ _id: req.params.id, });

    if (employee) {
        if (!isOwnerLike(req.user) && req.user?.warehouseId && employee.warehouseId.toString() !== req.user.warehouseId.toString()) {
            res.status(403);
            throw new Error('You can only delete employees in your warehouse.');
        }

        const [attendanceCount, taskCount] = await Promise.all([
            Attendance.countDocuments({ employeeId: employee._id }),
            Task.countDocuments({ assignedTo: employee._id })
        ]);

        if (attendanceCount > 0 || taskCount > 0) {
            res.status(400);
            throw new Error(`Cannot delete employee because they have related data: ${attendanceCount} attendance records and ${taskCount} tasks. Set the status to Inactive instead.`);
        }

        await employee.deleteOne();
        res.json({ message: 'Employee removed' });
    } else {
        res.status(404);
        throw new Error('Employee not found');
    }
});

module.exports = {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
