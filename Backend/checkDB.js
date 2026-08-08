const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const User = require('./src/models/User');
const Role = require('./src/models/Role');
const Tenant = require('./src/models/Tenant');

async function checkData() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected to MongoDB');

        const tenants = await Tenant.find();
        log(`Tenants: ${tenants.length}`);
        tenants.forEach(t => log(`- ${t.name} (${t._id})`));

        const roles = await Role.find();
        log(`Roles: ${roles.length}`);
        roles.forEach(r => log(`- ${r.name} (Tenant: ${r.tenantId}, ID: ${r._id})`));

        const users = await User.find().populate('roles');
        log(`Users: ${users.length}`);
        users.forEach(u => {
            log(`- ${u.email} (Tenant: ${u.tenantId}, ID: ${u._id}, Roles: ${u.roles.map(r => r.name).join(', ')})`);
        });

        fs.writeFileSync('db_check_results.txt', output);
        log('\nResults written to db_check_results.txt');

    } catch (error) {
        log('Error: ' + error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
