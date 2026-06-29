const userService = require('../../services/auth/user.service');
const documentService = require('../../services/ticket/document.service');
const mlService = require('../../services/mlService');

/**
 * Computes whether a user's profile is considered complete.
 * Extracted from the 3 controller functions that previously duplicated this logic verbatim.
 */
const isProfileComplete = (phone, dob, address, bankAccount) => Boolean(
    phone &&
    dob &&
    address?.street &&
    address?.city &&
    address?.state &&
    bankAccount?.bankName &&
    bankAccount?.accountNumber &&
    bankAccount?.ifsc
);

exports.updateProfile = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const files = req.files || [];

        const currentUser = await userService.getUserById(req.user.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let ocrResult = null;

        if (files.length > 0) {
            updateData.kyc = currentUser.toObject().kyc || {};
            const uploadedDocs = await documentService.uploadDocuments(files);

            for (let doc of uploadedDocs) {
                const originalFile = files.find(f => f.originalname === doc.name);
                if (originalFile && originalFile.fieldname === 'aadhaarDoc') {
                    updateData.kyc.aadhaar = doc.s3Key;
                } else if (originalFile && originalFile.fieldname === 'panDoc') {
                    updateData.kyc.pan = doc.s3Key;
                }
            }

            // KYC OCR verification via centralised ML service
            try {
                ocrResult = await mlService.verifyKyc(
                    files,
                    updateData.name || currentUser.name || '',
                    updateData.dob || currentUser.dob || ''
                );
            } catch (e) {
                console.error('OCR Verification Failed:', e.message);
                ocrResult = { match_found: false, message: 'OCR Engine Offline or Failed.' };
            }
        }

        const checkPhone   = updateData.phoneNumber  || currentUser.phoneNumber;
        const checkDob     = updateData.dob          || currentUser.dob;

        if (updateData.address && typeof updateData.address === 'string') {
            try { updateData.address = JSON.parse(updateData.address); } catch (e) {}
        }
        if (updateData.bankAccount && typeof updateData.bankAccount === 'string') {
            try { updateData.bankAccount = JSON.parse(updateData.bankAccount); } catch (e) {}
        }

        const checkAddress = updateData.address     || currentUser.address;
        const checkBank    = updateData.bankAccount  || currentUser.bankAccount;

        const complete = isProfileComplete(checkPhone, checkDob, checkAddress, checkBank);
        updateData.profileCompleted = complete;

        const user = await userService.updateUserProfile(req.user.userId, updateData);

        let missingFields = [];
        if (!complete) {
            if (!checkPhone) missingFields.push('Phone Number');
            if (!checkDob)   missingFields.push('Date of Birth');
            if (!checkAddress?.street || !checkAddress?.city || !checkAddress?.state) missingFields.push('Full Address');
            if (!checkBank?.bankName || !checkBank?.accountNumber || !checkBank?.ifsc) missingFields.push('Bank Details');
        }

        return res.status(200).json({
            message: complete ? 'Profile completed successfully!' : `Profile updated, missing: ${missingFields.join(', ')}`,
            user: userService.getPublicProfile(user),
            ocrResult
        });
    } catch (error) {
        console.error('[Auth] Update profile error:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const currentUser = await userService.getUserById(req.user.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updateData = { kyc: currentUser.toObject().kyc || {} };
        const uploadedDocs = await documentService.uploadDocuments(files);

        const fileField = files[0].fieldname;
        let docTypeKey = '';
        if (fileField === 'aadhaarDoc')      docTypeKey = 'aadhaar';
        else if (fileField === 'panDoc')     docTypeKey = 'pan';
        else if (fileField === 'dlDoc')      docTypeKey = 'dl';

        if (docTypeKey && uploadedDocs.length > 0) {
            updateData.kyc[docTypeKey] = uploadedDocs[0].s3Key;
        }

        // KYC OCR verification via centralised ML service
        let ocrResult = null;
        try {
            ocrResult = await mlService.verifyKyc(
                [files[0]],
                currentUser.name || '',
                currentUser.dob || ''
            );
        } catch (e) {
            console.error('OCR Verification Failed:', e.message);
            ocrResult = { match_found: false, message: 'OCR Engine Offline or Failed.' };
        }

        const complete = isProfileComplete(
            currentUser.phoneNumber,
            currentUser.dob,
            currentUser.address,
            currentUser.bankAccount
        );
        updateData.profileCompleted = complete;
        const user = await userService.updateUserProfile(req.user.userId, updateData);

        return res.status(200).json({
            message: 'Document uploaded successfully.',
            user: userService.getPublicProfile(user),
            ocrResult
        });
    } catch (error) {
        console.error('[Auth] Upload document error:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { docType } = req.params; // 'aadhaar', 'pan', 'dl'
        if (!['aadhaar', 'pan', 'dl'].includes(docType)) {
            return res.status(400).json({ message: 'Invalid document type.' });
        }

        const currentUser = await userService.getUserById(req.user.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updateData = { kyc: currentUser.toObject().kyc || {} };
        updateData.kyc[docType] = '';

        const complete = isProfileComplete(
            currentUser.phoneNumber,
            currentUser.dob,
            currentUser.address,
            currentUser.bankAccount
        );
        updateData.profileCompleted = complete;
        const user = await userService.updateUserProfile(req.user.userId, updateData);

        return res.status(200).json({
            message: 'Document removed successfully.',
            user: userService.getPublicProfile(user)
        });
    } catch (error) {
        console.error('[Auth] Delete document error:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};
