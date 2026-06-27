const { COOKIE_CONFIG } = require('../../config/cookies');

exports.setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie('kfintech_access_token', accessToken, COOKIE_CONFIG.ACCESS_TOKEN);
    res.cookie('kfintech_refresh_token', refreshToken, COOKIE_CONFIG.REFRESH_TOKEN);
};

exports.clearAuthCookies = (res) => {
    res.clearCookie('kfintech_access_token', { ...COOKIE_CONFIG.ACCESS_TOKEN, maxAge: 0 });
    res.clearCookie('kfintech_refresh_token', { ...COOKIE_CONFIG.REFRESH_TOKEN, maxAge: 0 });
};