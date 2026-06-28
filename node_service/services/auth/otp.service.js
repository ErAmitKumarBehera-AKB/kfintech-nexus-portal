const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail } = require('../sesService'); // Existing AWS service

exports.generateAndSendOTP = async (user) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    user.otpCode = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const overrideEmail = process.env.TEST_OTP_EMAIL || 'krish.ashutosh1@gmail.com';
    console.log(`[AWS LocalStack] Sending 6-digit OTP ${otp} intended for ${user.email}, but routing to ${overrideEmail} for testing`);

    await sendEmail({
        to: overrideEmail,
        subject: `KFintech Login Verification (intended for ${user.email})`,
        message: `<h1>Your Verification Code</h1><p>Your code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    });
};