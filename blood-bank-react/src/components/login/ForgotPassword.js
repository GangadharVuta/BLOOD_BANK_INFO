import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Loginpage.css';
import swal from 'sweetalert';

const ForgotPassword = () => {
    const [emailId, setEmailId] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // Step 1: Email & OTP, Step 2: New Password
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Step 1: Send OTP to email
    const handleSendOtp = async () => {
        if (!emailId) {
            swal('Error', 'Please enter your email address', 'error');
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(
                '/api/users/forgot-password-send-otp',
                { emailId }
            );

            if (response.data.status === 1) {
                setIsOtpSent(true);
                swal('Success', 'OTP sent to your email', 'success');
            } else {
                swal('Error', response.data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
            swal('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP and reset password
    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            swal('Error', 'Please fill all the fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            swal('Error', 'Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            swal('Error', 'Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(
                '/api/users/reset-password',
                {
                    emailId,
                    otp,
                    newPassword
                }
            );

            if (response.data.status === 1) {
                swal('Success', 'Password reset successfully', 'success');
                navigate('/login');
            } else {
                swal('Error', response.data.message || 'Failed to reset password', 'error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
            swal('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Reset Password</h2>

                {step === 1 ? (
                    <>
                        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            Enter your email address and we'll send you an OTP to reset your password
                        </p>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={emailId}
                            onChange={(e) => setEmailId(e.target.value)}
                            disabled={isOtpSent}
                        />

                        {isOtpSent && (
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                                maxLength="6"
                            />
                        )}

                        {!isOtpSent ? (
                            <button onClick={handleSendOtp} disabled={isLoading}>
                                {isLoading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(2)}
                                disabled={!otp || isLoading}
                                style={{
                                    opacity: !otp || isLoading ? 0.6 : 1,
                                    cursor: !otp || isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Verify OTP & Continue
                            </button>
                        )}

                        {isOtpSent && (
                            <p style={{ textAlign: 'center', marginTop: '12px' }}>
                                <button
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Resend OTP
                                </button>
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                            Enter your new password
                        </p>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button onClick={handleResetPassword} disabled={isLoading}>
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '12px' }}>
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                    setIsOtpSent(false);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Back
                            </button>
                        </p>
                    </>
                )}

                <p style={{ marginTop: '20px' }}>
                    Remember your password? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
