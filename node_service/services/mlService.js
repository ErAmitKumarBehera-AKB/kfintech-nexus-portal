
const axios = require('axios');
const FormData = require('form-data');

const getMlUrl = () => process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Runs account-number OCR verification.
 * @param {Buffer}  fileBuffer    - Raw file bytes
 * @param {string}  originalname  - Original filename (for Content-Disposition)
 * @param {string}  mimetype      - MIME type of the file
 * @param {string}  accountNumber - Account number to match against
 * @returns {Promise<{account_found: boolean, extracted_text: string[], message: string}>}
 */
const verifyAccount = async (fileBuffer, originalname, mimetype, accountNumber) => {
    const formData = new FormData();
    formData.append('account_number', accountNumber || '');
    formData.append('files', fileBuffer, { filename: originalname, contentType: mimetype });

    const response = await axios.post(`${getMlUrl()}/ocr/verify-account`, formData, {
        headers: formData.getHeaders()
    });
    return response.data;
};

/**
 * Runs KYC name+DOB OCR verification against one or more document images.
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} files - Multer file objects
 * @param {string} targetName - Full name to verify
 * @param {string} targetDob  - Date of birth to verify
 * @returns {Promise<{match_found: boolean, extracted_text: string[], message: string}>}
 */
const verifyKyc = async (files, targetName, targetDob) => {
    const formData = new FormData();
    formData.append('target_name', targetName || '');
    formData.append('target_dob', targetDob || '');
    files.forEach(f => {
        formData.append('files', f.buffer, { filename: f.originalname, contentType: f.mimetype });
    });

    const response = await axios.post(`${getMlUrl()}/ocr/verify-kyc`, formData, {
        headers: formData.getHeaders()
    });
    return response.data;
};

/**
 * Generates a 3-bullet AI summary of a ticket.
 * @param {{title: string, description: string, serviceType: string, metadata: object}} ticketData
 * @returns {Promise<{summary: string[]}>}
 */
const summarizeTicket = async (ticketData) => {
    const response = await axios.post(`${getMlUrl()}/summarize/ticket`, {
        ticket_data: ticketData
    });
    return response.data;
};

/**
 * Analyses complaint text for sentiment and fraud signals.
 * @param {string} text - Complaint or ticket text to analyse
 * @returns {Promise<{sentiment: string, score: number, priority: string, fraud_alert: boolean, intent: string}>}
 */
const analyzeSentiment = async (text) => {
    const response = await axios.post(`${getMlUrl()}/sentiment/analyze`, { text });
    return response.data;
};

module.exports = { verifyAccount, verifyKyc, summarizeTicket, analyzeSentiment };
