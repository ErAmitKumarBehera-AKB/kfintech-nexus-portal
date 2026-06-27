const userService = require('../../services/auth/user.service');
const documentService = require('../../services/ticket/document.service'); // Reuse S3 upload logic

exports.updateProfile = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const files = req.files || [];

        // Fetch current user to merge kyc data if needed
        const currentUser = await userService.getUserById(req.user.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Process file uploads for KYC
        if (files.length > 0) {
            updateData.kyc = currentUser.toObject().kyc || {};
            const uploadedDocs = await documentService.uploadDocuments(files);
            
            for (let doc of uploadedDocs) {
                // Determine document type from fieldname if possible, else guess by originalname
                // For upload.any(), req.files is an array with fieldname
                const originalFile = files.find(f => f.originalname === doc.name);
                if (originalFile && originalFile.fieldname === 'aadhaarDoc') {
                    updateData.kyc.aadhaar = doc.s3Key;
                } else if (originalFile && originalFile.fieldname === 'panDoc') {
                    updateData.kyc.pan = doc.s3Key;
                }
            }
        }

        // Check if Profile is now Complete
        // Requirements: PAN, Aadhaar, Phone Number, Address (street, city, state)
        const checkKyc = updateData.kyc || currentUser.kyc;
        const checkPhone = updateData.phoneNumber || currentUser.phoneNumber;
        if (updateData.address && typeof updateData.address === 'string') {
            try {
                updateData.address = JSON.parse(updateData.address);
            } catch (err) {
                console.error('Failed to parse address JSON:', err.message);
            }
        }

        const checkAddress = updateData.address || currentUser.address;

        const isComplete = Boolean(
            checkKyc?.aadhaar && 
            checkKyc?.pan && 
            checkPhone && 
            checkAddress?.street && 
            checkAddress?.city && 
            checkAddress?.state
        );

        updateData.profileCompleted = isComplete;

        const user = await userService.updateUserProfile(req.user.userId, updateData);

        let missingFields = [];
        if (!isComplete) {
            if (!checkKyc?.aadhaar) missingFields.push('Aadhaar Document');
            if (!checkKyc?.pan) missingFields.push('PAN Document');
            if (!checkPhone) missingFields.push('Phone Number');
            if (!checkAddress?.street) missingFields.push('Street Address');
            if (!checkAddress?.city) missingFields.push('City');
            if (!checkAddress?.state) missingFields.push('State');
        }

        return res.status(200).json({ 
            message: isComplete ? 'Profile completed successfully!' : `Profile updated, but still missing: ${missingFields.join(', ')}`, 
            user: userService.getPublicProfile(user) 
        });
    } catch (error) {
        console.error('[Auth] Update profile error:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};
