// Ensure AWS_ENDPOINT_URL points to localhost if running outside docker
if (!process.env.AWS_ENDPOINT_URL) {
    process.env.AWS_ENDPOINT_URL = "http://127.0.0.1:4566";
}

const { sendEmail } = require('./services/sesService');
const { VerifyEmailIdentityCommand, SESClient } = require('@aws-sdk/client-ses');
const { sendSMS } = require('./services/snsService');
const { uploadToS3 } = require('./services/s3Service');
const { CreateBucketCommand, S3Client } = require('@aws-sdk/client-s3');
async function testLocalStack() {
    console.log("Starting LocalStack SES & SNS test...");

    try {
        console.log("\n0. Testing S3 (Creating Bucket & Uploading)...");
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            endpoint: process.env.AWS_ENDPOINT_URL || 'http://127.0.0.1:4566',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
            },
            forcePathStyle: true
        });

        const bucketName = process.env.AWS_BUCKET_NAME || 'kfintech-bucket';
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`✅ S3 Bucket '${bucketName}' created (or already exists).`);
        } catch (e) {
            if (e.name === 'BucketAlreadyOwnedByYou' || e.name === 'BucketAlreadyExists') {
                console.log(`✅ S3 Bucket '${bucketName}' already exists.`);
            } else {
                console.warn(`⚠️ Could not create S3 Bucket '${bucketName}'. Proceeding anyway. Error: ${e.message}`);
            }
        }

        const s3Response = await uploadToS3({
            Key: "test-upload.txt",
            Body: Buffer.from("Hello LocalStack S3!"),
            ContentType: "text/plain"
        });
        console.log("✅ File uploaded successfully to S3!");

        console.log("\n2. Testing SMS (SNS)...");
        const smsResponse = await sendSMS({
            phoneNumber: "+1234567890",
            message: "Your OTP is 123456"
        });
        console.log("✅ SMS sent successfully! MessageId:", smsResponse.MessageId);

        console.log("\n1. Testing Email (SES)...");
        // Verify email identity first for LocalStack
        const sesClient = new SESClient({
            region: process.env.AWS_REGION || 'ap-south-1',
            endpoint: process.env.AWS_ENDPOINT_URL || 'http://127.0.0.1:4566',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
            }
        });
        await sesClient.send(new VerifyEmailIdentityCommand({ EmailAddress: 'test@example.com' }));
        const emailResponse = await sendEmail({
            to: "investor@kfintech.com",
            subject: "Welcome to KFintech",
            message: "<h1>Welcome!</h1><p>Your account is ready.</p>"
        });
        console.log("✅ Email sent successfully! MessageId:", emailResponse.MessageId);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}


testLocalStack();
