require('dotenv').config(); // Restarting backend
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Connect to Database and auto-seed admin
const seedAdminUser = async () => {
    try {
        const User = require('./models/User');
        const Role = require('./models/Role');
        const adminPassword = process.env.ADMIN_PASSWORD || 'Machad!Admin2026#';

        let ownerRole = await Role.findOne({ name: 'Owner' });
        if (!ownerRole) {
            ownerRole = await Role.create({
                name: 'Owner',
                description: 'Full system access - Business Owner',
                isSystemRole: true
            });
        }

        const defaultAdmins = [
            { email: 'cabdirahmanjmaxamad@gmail.com', name: 'Abdirahman Mohamed' },
            { email: 'abdirahmanmohamedabdulle08@gmail.com', name: 'Abdirahman Mohamed Abdulle' }
        ];

        if (process.env.ADMIN_EMAIL) {
            defaultAdmins.push({
                email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
                name: process.env.ADMIN_NAME || 'System Administrator'
            });
        }

        for (const adminInfo of defaultAdmins) {
            const cleanEmail = adminInfo.email.trim().toLowerCase();
            let adminUser = await User.findOne({ email: cleanEmail });
            if (!adminUser) {
                adminUser = await User.create({
                    fullName: adminInfo.name,
                    email: cleanEmail,
                    passwordHash: adminPassword,
                    role: 'Super Admin',
                    roles: [ownerRole._id],
                    status: 'active'
                });
                console.log(`✓ Admin user seeded (${cleanEmail})`);
            } else {
                adminUser.fullName = adminUser.fullName || adminInfo.name;
                adminUser.role = 'Super Admin';
                if (!adminUser.roles || !adminUser.roles.length) {
                    adminUser.roles = [ownerRole._id];
                }
                adminUser.status = 'active';
                adminUser.passwordHash = adminPassword;
                await adminUser.save();
                console.log(`✓ Admin user verified & updated (${cleanEmail})`);
            }
        }
    } catch (error) {
        console.error('Auto-seed error:', error.message);
    }
};

connectDB().then(async () => {
    const TeacherAttendance = require('./models/TeacherAttendance');
    const StudentAttendance = require('./models/StudentAttendance');
    await Promise.all([
        TeacherAttendance.removeLegacyDailyUniqueIndex(),
        StudentAttendance.removeLegacyDailyUniqueIndex()
    ]);
    await seedAdminUser();
}).catch(err => {
    console.error('Failed to connect to MongoDB on startup. The server will start, but DB operations will fail until connection is established:', err.message);
});

const app = express();

// Middleware. Set FRONTEND_URL to your deployed frontend URL in production.
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
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
