import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setSuccessMessage('An OTP has been sent to your email.');
            setIsOtpStep(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await authApi.resetPassword(email.trim().toLowerCase(), otp, password);
            navigate('/login', { replace: true, state: { message: 'Password successfully reset! Please login with your new password.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. OTP may be invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h2>Reset Password</h2>
                <p>
                    Remembered it?{' '}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>
            </div>

            <div>
                <div>
                    
                    {error && (
                        <div>
                            ⚠️ {error}
                        </div>
                    )}
                    {successMessage && (
                        <div>
                            ✅ {successMessage}
                        </div>
                    )}

                    {!isOtpStep ? (
                        <form onSubmit={handleSendOtp}>
                            <div>
                                <label>Email address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}>
                                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div>
                                <label>6-Digit OTP</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    
                                />
                            </div>

                            <div>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    
                                />
                            </div>

                            <div>
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    
                                />
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOtpStep(false);
                                        setSuccessMessage('');
                                        setError('');
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}>
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
