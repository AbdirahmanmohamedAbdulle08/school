const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./models/Role');

dotenv.config();

const checkRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const roles = await Role.find({});
        console.log('Available Roles:');
        roles.forEach(r => console.log(`- Name: "${r.name}", ID: ${r._id}, Tenant: ${r.tenantId}`));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkRoles();
