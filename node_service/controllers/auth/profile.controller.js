const userService = require('../../services/auth/user.service');

exports.updateProfile = async (req, res) => {
    try {
        const user = await userService.updateUserProfile(req.user.id, req.body);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ 
            message: 'Profile updated.', 
            user: userService.getPublicProfile(user) 
        });
    } catch (error) {
        console.error('[Auth] Update profile error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
