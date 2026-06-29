const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { sendEmail } = require('../sesService'); // Existing AWS / Resend service
const { sendSMS } = require('../snsService'); // Existing AWS / Twilio service

const { sendEmail } = require('../sesService');

/**
 * Generates a 6-digit OTP, hashes it with bcrypt, persists it on the user
 * document, and emails it to the user's actual email address.
 *
 * The OTP expires after 10 minutes.
 */

exports.generateAndSendOTP = async (user) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log("\n======================================");
    console.log("🔐 DEVELOPMENT OTP:", otp);
    console.log("👤 User:", user.email);
    console.log("======================================\n");
    const otpHash = await bcrypt.hash(otp, 10);

    user.otpCode = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();


    // Send OTP via Email (Resend in Production / SES Local)
    try {
        await sendEmail({
            to: user.email,
            subject: `FinnovaX Login Verification`,
            message: `<h1>Your Verification Code</h1><p>Your code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`
        });
    } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
    }

    // Try sending OTP via SMS (Twilio in Production / SNS Local) if they have a phone number
    if (user.phoneNumber) {
        try {
            await sendSMS({
                phoneNumber: user.phoneNumber,
                message: `FinnovaX Verification Code: ${otp}. Expires in 10 mins.`
            });
        } catch (smsError) {
            console.error('Failed to send OTP SMS:', smsError);
        }
    }

    await sendEmail({
        to: user.email,
        subject: 'KFintech Nexus — Login Verification Code',
        message: `
            <h1>Your Verification Code</h1>
            <p>Hello ${user.name || 'Valued Investor'},</p>
            <p>Your one-time login code is: <strong style="font-size:1.4em">${otp}</strong></p>
            <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <p>If you did not request this code, please ignore this email or contact support immediately.</p>
        `
    });
};