const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Late', 'Absent'],
        default: 'Present'
    },
    session: {
        type: String,
        enum: ['Morning', 'Breakfast', 'Evening'],
        default: 'Morning'
    },
    arrivalTime: {
        type: String,
        trim: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Allow separate Morning, Breakfast, and Evening entries on the same date.
studentAttendanceSchema.index({ studentId: 1, date: -1, session: 1, createdAt: -1 });

const StudentAttendance = mongoose.model('StudentAttendance', studentAttendanceSchema);

// A previous version created a unique { studentId, date } index. That index
// prevents additional sessions from being saved and causes E11000 errors.
StudentAttendance.removeLegacyDailyUniqueIndex = async () => {
    let indexes = [];
    try {
        indexes = await StudentAttendance.collection.indexes();
    } catch (error) {
        // A fresh database has no collection or indexes yet.
        if (error.code !== 26) throw error;
    }

    const legacyIndex = indexes.find(index =>
        index.unique &&
        index.key?.studentId === 1 &&
        index.key?.date === 1 &&
        Object.keys(index.key).length === 2
    );

    if (legacyIndex) {
        await StudentAttendance.collection.dropIndex(legacyIndex.name);
        console.log('Removed legacy student attendance daily unique index.');
    }

    await StudentAttendance.createIndexes();
};

module.exports = StudentAttendance;
