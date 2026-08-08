const axios = require('axios');

const payload = {
    tenantName: "LogoTestTenant2",
    subdomain: "logotest" + Math.floor(Math.random() * 10000),
    email: "logo2@test.com",
    password: "password123",
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    firstName: "Test",
    lastName: "User",
    phone: "1234567890",
    address: "123 Test St"
};

console.log("Sending payload...");

axios.post('http://localhost:5000/api/tenants/register', payload)
    .then(res => {
        console.log("Registration successful!");
        console.log("User Response:", res.data);
    })
    .catch(err => {
        console.error("Registration failed:");
        console.error(err.response ? err.response.data : err.message);
    });
