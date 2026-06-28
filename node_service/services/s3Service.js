const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config/aws");

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || "kfintech-bucket";

// Upload File
const uploadToS3 = async (params) => {
  return await s3.send(new PutObjectCommand({ Bucket: AWS_BUCKET_NAME, ...params }));
};

// Delete File
const deleteFromS3 = async (fileName) => {
  return await s3.send(
    new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: fileName,
    })
  );
};

// Generate Pre-Signed Download URL
const generateDownloadUrl = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: fileName,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 300, // 5 minutes
  });
};

// Download File as Buffer
const downloadFromS3 = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: fileName,
  });
  
  const response = await s3.send(command);
  
  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  generateDownloadUrl,
  downloadFromS3,
};
