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

// Allow multiple records per student per day per session to keep permanent history
studentAttendanceSchema.index({ studentId: 1, date: 1, session: 1 });

// Programmatically drop the unique index if it exists
mongoose.connection.on('connected', async () => {
    try {
        await mongoose.connection.db.collection('studentattendances').dropIndex('studentId_1_date_1_session_1');
    } catch (e) {
        // Silence errors if index doesn't exist
    }
});

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
