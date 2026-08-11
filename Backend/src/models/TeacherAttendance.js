const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    arrivalTime: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// A teacher can be marked more than once on the same day. This index keeps
// those attendance-history queries fast without preventing additional entries.
teacherAttendanceSchema.index({ teacherId: 1, date: -1, createdAt: -1 });

const TeacherAttendance = mongoose.model('TeacherAttendance', teacherAttendanceSchema);

// Earlier versions enforced a single record per teacher per date. Remove that
// legacy database index once so teachers can have multiple attendance entries
// on the same day.
TeacherAttendance.removeLegacyDailyUniqueIndex = async () => {
    let indexes = [];
    try {
        indexes = await TeacherAttendance.collection.indexes();
    } catch (error) {
        // A fresh database has no collection or indexes yet.
        if (error.code !== 26) throw error;
    }
    const legacyIndex = indexes.find(index =>
        index.unique &&
        index.key?.teacherId === 1 &&
        index.key?.date === 1 &&
        Object.keys(index.key).length === 2
    );

    if (legacyIndex) {
        await TeacherAttendance.collection.dropIndex(legacyIndex.name);
        console.log('Removed legacy teacher attendance daily unique index.');
    }

    await TeacherAttendance.createIndexes();
};

module.exports = TeacherAttendance;
