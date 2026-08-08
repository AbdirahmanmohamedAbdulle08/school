const mongoose = require('mongoose');
const Role = require('./src/models/Role');
const Tenant = require('./src/models/Tenant');
require('dotenv').config();

const dumpRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const latestTenant = await Tenant.findOne().sort({ createdAt: -1 });
        if (!latestTenant) {
            console.log("No tenants");
            process.exit(0);
        }

        const roles = await Role.find({ tenantId: latestTenant._id }).lean();
        console.log(JSON.stringify(roles, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dumpRoles();
