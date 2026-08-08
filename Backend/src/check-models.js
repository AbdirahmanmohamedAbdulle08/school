require('dotenv').config();
const mongoose = require('mongoose');

console.log('Loading models...');

try {
    require('./models/Tenant');
    console.log('Tenant model loaded.');
    require('./models/Warehouse');
    console.log('Warehouse model loaded.');
    require('./models/User');
    console.log('User model loaded.');
    require('./models/Role');
    console.log('Role model loaded.');
    require('./models/Permission');
    console.log('Permission model loaded.');
    require('./models/Account');
    console.log('Account model loaded.');
    require('./models/Product');
    console.log('Product model loaded.');
    require('./models/Service');
    console.log('Service model loaded.');
    require('./models/Customer');
    console.log('Customer model loaded.');
    require('./models/Vendor');
    console.log('Vendor model loaded.');

    console.log('---------------------------');
    console.log('SUCCESS: All models loaded without syntax errors.');
} catch (error) {
    console.error('ERROR: Failed to load models.');
    console.error(error);
    process.exit(1);
}
