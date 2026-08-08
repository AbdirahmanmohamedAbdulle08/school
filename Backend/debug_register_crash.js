const axios = require('axios');

const testRegistration = async () => {
    try {
        const payload = {
            tenantName: 'Debug Crash Tenant',
            legalName: 'Crash Test Dummy LLC',
            // subdomain not provided, shoud auto-generate or fail? Frontend generates it.
            subdomain: 'debug-crash-' + Date.now(),
            email: 'crash.test@example.com',
            password: 'password123',
            firstName: 'Crash',
            lastName: 'Test',
            phone: '555-0101',
            address: '123 Crash Lane',
            brandColor: '#000000',
            logo: null
        };

        console.log("Sending payload:", payload);

        const res = await axios.post('http://localhost:5000/api/tenants/register', payload);
        console.log("Success:", res.data);
    } catch (error) {
        console.error("Error Status:", error.response?.status);
        console.error("Error Data:", error.response?.data);
    }
};

testRegistration();
