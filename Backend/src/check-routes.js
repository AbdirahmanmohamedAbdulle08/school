const express = require('express');
const app = express();

console.log('Verifying API Routes Setup...');

try {
    app.use('/api/tenants', require('./routes/tenantRoutes'));
    console.log('Tenant Routes OK');
    app.use('/api/warehouses', require('./routes/branchRoutes'));
    console.log('Warehouse Routes OK');
    app.use('/api/users', require('./routes/userRoutes'));
    console.log('User Routes OK');
    app.use('/api/products', require('./routes/productRoutes'));
    console.log('Product Routes OK');
    app.use('/api/customers', require('./routes/customerRoutes'));
    console.log('Customer Routes OK');
    app.use('/api/vendors', require('./routes/vendorRoutes'));
    console.log('Vendor Routes OK');
    app.use('/api/accounts', require('./routes/accountRoutes'));
    console.log('Account Routes OK');
    app.use('/api/services', require('./routes/serviceRoutes'));
    console.log('Service Routes OK');

    console.log('---------------------------');
    console.log('SUCCESS: All routes linked successfully.');
} catch (error) {
    console.error('ERROR: Failed to link routes.');
    console.error(error);
    process.exit(1);
}
