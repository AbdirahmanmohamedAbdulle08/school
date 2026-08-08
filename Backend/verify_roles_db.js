const mongoose = require('mongoose');
const Role = require('./src/models/Role');
const Tenant = require('./src/models/Tenant');
require('dotenv').config();

const verifyRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const latestTenant = await Tenant.findOne().sort({ createdAt: -1 });
        if (!latestTenant) {
            console.log("No tenants found");
            process.exit(0);
        }

        console.log(`Checking roles for Tenant: ${latestTenant.name} (${latestTenant._id})`);
        const roles = await Role.find({ tenantId: latestTenant._id });
        console.log(`Found ${roles.length} roles:`);
        roles.forEach(r => {
            console.log(`- ${r.name} (isSystemRole: ${r.isSystemRole}, isRequired: ${r.isRequired})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyRoles();
