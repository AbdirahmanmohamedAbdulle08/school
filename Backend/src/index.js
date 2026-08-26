require('dotenv').config(); // Restarting backend
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Connect to Database and auto-seed admin
// Ensure base system roles exist on startup
const ensureSystemRoles = async () => {
    try {
        const Role = require('./models/Role');
        let ownerRole = await Role.findOne({ name: 'Owner' });
        if (!ownerRole) {
            ownerRole = await Role.create({
                name: 'Owner',
                description: 'Full system access - Business Owner',
                isSystemRole: true
            });
            console.log('✓ System Owner role initialized');
        }
    } catch (error) {
        console.error('Role initialization error:', error.message);
    }
};

connectDB().then(async () => {
    const TeacherAttendance = require('./models/TeacherAttendance');
    const StudentAttendance = require('./models/StudentAttendance');
    await Promise.all([
        TeacherAttendance.removeLegacyDailyUniqueIndex(),
        StudentAttendance.removeLegacyDailyUniqueIndex()
    ]);
    await ensureSystemRoles();
}).catch(err => {
    console.error('Failed to connect to MongoDB on startup. The server will start, but DB operations will fail until connection is established:', err.message);
});

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins dynamically to support credentials: true
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/classes', require('./routes/clsRoutes'));
app.use('/api/guardians', require('./routes/guardianRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/student-attendance', require('./routes/studentAttendanceRoutes'));
app.use('/api/teacher-attendance', require('./routes/teacherAttendanceRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/salaries', require('./routes/salaryRoutes'));
app.use('/api/wallets', require('./routes/walletRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/cashbook', require('./routes/cashbookRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Unchanged AI/Analytics/Dashboard/Settings routes if they are generic, 
// but we deleted their routes. We can re-add them if needed, but since we deleted them let's remove.
// Wait, I only deleted specific warehouse ones. Let's see what I kept:
// aiRoutes, aiAnalyticsRoutes, dashboardRoutes, settingsRoutes, tenantRoutes, etc.
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/aiAnalyticsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));

app.get('/', (req, res) => {
    res.send('Institute API is running...');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5005; // Was 5005 in .env

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
