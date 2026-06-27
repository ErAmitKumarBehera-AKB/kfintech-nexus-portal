const User = require('../../models/User');

exports.getUserById = async (userId) => {
    return await User.findById(userId);
};

exports.getUserByEmail = async (email) => {
    return await User.findOne({ email: email.toLowerCase().trim() });
};

exports.updateUserProfile = async (userId, updateData) => {
    const allowed = ['name', 'phoneNumber', 'bankAccount', 'nominee', 'address', 'kyc', 'profileCompleted'];
    const updates = {};
    
    allowed.forEach(key => {
        if (updateData[key] !== undefined) {
            // For nested objects like kyc, we might need deep merge, but direct assign is ok if full object is sent
            updates[key] = updateData[key];
        }
    });

    return await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true
    });
};

exports.getPublicProfile = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        kyc: user.kyc,
        bankAccount: user.bankAccount,
        nominee: user.nominee,
        address: user.address,
        profileCompleted: user.profileCompleted
    };
};
