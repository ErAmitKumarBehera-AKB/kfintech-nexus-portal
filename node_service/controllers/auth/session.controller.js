const userService = require('../../services/auth/user.service');
const tokenService = require('../../services/auth/token.service');
const cookieService = require('../../services/auth/cookie.service');

exports.refresh = async (req, res) => {
    try {
        const currentRefreshToken = req.cookies.kfintech_refresh_token;
        if (!currentRefreshToken) return res.status(401).json({ message: 'No refresh token provided.' });

        const { newAccessToken, newRefreshToken, userId } = await tokenService.rotateRefreshToken(currentRefreshToken);
        
        cookieService.setAuthCookies(res, newAccessToken, newRefreshToken);
        return res.status(200).json({ message: 'Session refreshed.' });
    } catch (error) {
        console.warn('[Auth] Refresh flow failure:', error.message);
        cookieService.clearAuthCookies(res);
        return res.status(401).json({ message: 'Session invalid. Please log in again.' });
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.kfintech_refresh_token;
        if (refreshToken) {
            // Revoke specific token (or entire family depending on strictness)
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const RefreshToken = require('../../models/RefreshToken');
            await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
        }
        
        cookieService.clearAuthCookies(res);
        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
        cookieService.clearAuthCookies(res); // Always clear cookies on logout attempt
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        if (!user || !user.isActive) return res.status(401).json({ message: 'User disabled or not found.' });
        
        return res.status(200).json({ 
            user: userService.getPublicProfile(user) 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
    }
};