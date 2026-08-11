const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const Role = require('./models/Role');

dotenv.config({ path: path.join(__dirname, '../.env') });

const required = (name) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} must be set in Backend/.env`);
    return value;
};

const seedAdmin = async () => {
    try {
        const mongoUri = required('MONGO_URI');
        const email = (process.env.ADMIN_EMAIL || 'admin@machad.edu').trim().toLowerCase();
        const password = required('ADMIN_PASSWORD');
        const fullName = (process.env.ADMIN_NAME || 'System Administrator').trim();

        // Connect only to the configured database. Do not fall back to a local or
        // in-memory database, otherwise a successful seed could create the user
        // somewhere other than MongoDB Atlas.
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

        let ownerRole = await Role.findOne({ name: 'Owner' });
        if (!ownerRole) {
            ownerRole = await Role.create({
                name: 'Owner',
                description: 'Full system access - Business Owner',
                isSystemRole: true
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            user.fullName = fullName;
            user.passwordHash = password;
            user.role = 'Super Admin';
            user.roles = [ownerRole._id];
            user.status = 'active';
            await user.save();
            console.log(`Reset active administrator: ${email}`);
        } else {
            await User.create({
                fullName,
                email,
                passwordHash: password,
                role: 'Super Admin',
                roles: [ownerRole._id],
                status: 'active'
            });
            console.log(`Created active administrator: ${email}`);
        }
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`Unable to seed administrator: ${error.message}`);
        process.exit(1);
    });
