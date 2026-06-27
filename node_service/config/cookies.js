const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_CONFIG = {
    ACCESS_TOKEN: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    },
    REFRESH_TOKEN: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/api/auth/refresh', // Restrict refresh token to this endpoint
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

module.exports = { COOKIE_CONFIG };