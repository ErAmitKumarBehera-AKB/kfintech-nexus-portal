const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runDemo() {
    console.log("🚀 Starting E2E Demo: Registration -> Login -> DB Verification -> AWS SES/SNS Check");
    const testEmail = `investor_${Date.now()}@kfintech.com`;
    const testPhone = `+91987${Math.floor(1000000 + Math.random() * 9000000)}`;

    try {
        // 1. Test Registration
        console.log(`\n[1] Registering new user: ${testEmail}`);
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            email: testEmail,
            password: 'SecurePassword123!',
            phoneNumber: testPhone,
            panNumber: 'ABCDE1234F',
            aadharNumber: '123456789012',
            dateOfBirth: '1990-01-01'
        });
        console.log("✅ Registration Successful!");
        console.log("Registration Response:", regRes.data);

        // 2. Test Login
        console.log(`\n[2] Logging in user: ${testEmail}`);
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testEmail,
            password: 'SecurePassword123!'
        });
        console.log("✅ Login Successful! (This triggers the AWS OTP Email/SMS)");
        console.log("Login Response:", loginRes.data);
        const token = loginRes.data.accessToken;

        // 3. Test Profile Retrieval (DB Verification)
        console.log(`\n[3] Fetching Profile from Database...`);
        const profileRes = await axios.get(`${BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Profile fetched successfully!");
        console.log("Profile Data in MongoDB:", profileRes.data.profile);

    } catch (error) {
        console.error("❌ Demo Failed:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

runDemo();
