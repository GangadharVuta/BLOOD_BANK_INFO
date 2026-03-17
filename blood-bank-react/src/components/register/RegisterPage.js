/**
 * Register Page - Firebase Phone Authentication OTP Flow
 * 
 * Two-step registration:
 * 1. Phone number + Send OTP (Firebase handles SMS)
 * 2. Verify OTP + Complete registration with user details
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../firebase';
import './RegisterPage.css';
import swal from 'sweetalert';
import Logo from '../../assets/logo.png';
import axios from 'axios';

const API_BASE_URL = '/api';

function RegisterPage() {
  // Step 1: Phone Authentication
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2: User Details (after OTP verification)
  const [userName, setUserName] = useState('');
  const [emailId, setEmailId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationLoading, setRegistrationLoading] = useState(false);

  const navigate = useNavigate();
  const recaptchaVerifierRef = useRef(null);

  /**
   * Initialize reCAPTCHA verifier on component mount
   */
  useEffect(() => {
    // Create recaptcha verifier once
    if (!recaptchaVerifierRef.current && auth) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            console.warn('reCAPTCHA expired');
          }
        }, auth);
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    return () => {
      // Cleanup on unmount
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  /**
   * Validate Indian phone number (10 digits)
   */
  const validatePhoneNumber = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  /**
   * Format phone number to E.164 format (+91...)
   */
  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    return phone;
  };

  /**
   * Handle "Send OTP" button click
   */
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      swal('Error', 'Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      swal('Error', 'reCAPTCHA not initialized. Please refresh the page.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setOtpSent(true);
      swal('Success', 'OTP sent to your phone number', 'success');
    } catch (error) {
      console.error('Error sending OTP:', error);
      swal('Error', error.message || 'Failed to send OTP. Please try again.', 'error');
      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Verify OTP" button click
   */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || !/^\d{6}$/.test(otp)) {
      swal('Error', 'Please enter a valid 6-digit OTP', 'error');
      return;
    }

    if (!confirmationResult) {
      swal('Error', 'OTP session expired. Please send OTP again.', 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(otp);
      setFirebaseUid(userCredential.user.uid);
      setOtpVerified(true);
      swal('Success', 'Phone number verified!', 'success');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.code === 'auth/invalid-verification-code') {
        swal('Error', 'Invalid OTP. Please try again.', 'error');
      } else {
        swal('Error', error.message || 'Failed to verify OTP', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate registration form
   */
  const validateRegistrationForm = () => {
    if (!userName.trim()) {
      swal('Error', 'Please enter your name', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) {
      swal('Error', 'Please enter a valid email address', 'error');
      return false;
    }

    if (!bloodGroup) {
      swal('Error', 'Please select a blood group', 'error');
      return false;
    }

    if (!/^\d{6}$/.test(pincode)) {
      swal('Error', 'Please enter a valid 6-digit pincode', 'error');
      return false;
    }

    if (password.length < 6) {
      swal('Error', 'Password must be at least 6 characters', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      swal('Error', 'Passwords do not match', 'error');
      return false;
    }

    return true;
  };

  /**
   * Handle final registration submission
   */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegistrationForm()) {
      return;
    }

    setRegistrationLoading(true);

    try {
      // Get ID token from Firebase
      const idToken = await auth.currentUser.getIdToken();

      // Submit registration to backend
      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        {
          userName,
          emailId,
          bloodGroup,
          pincode,
          password,
          phoneNumber, // Pass verified phone number
          idToken, // Pass Firebase ID token for server-side verification
          firebaseUid // Additional context
        },
        { timeout: 10000 }
      );

      if (response.data.status === 1) {
        swal('Success', 'Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        swal('Error', response.data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      swal('Error', error.response?.data?.message || 'Failed to register. Please try again.', 'error');
    } finally {
      setRegistrationLoading(false);
    }
  };

  /**
   * Handle "Change Phone Number" link
   */
  const handleChangePhoneNumber = () => {
    setPhoneNumber('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setConfirmationResult(null);
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-header">
          <img src={Logo} alt="Blood Bank" className="logo" />
          <h1>Blood Bank Registration</h1>
          <p className="subtitle">Firebase Phone Authentication</p>
        </div>

        {/* reCAPTCHA Container (invisible) */}
        <div id="recaptcha-container"></div>

        <form onSubmit={handleRegisterSubmit}>
          {!otpVerified ? (
            // Step 1: Phone & OTP Verification
            <div className="registration-form">
              <div className="form-section">
                <h2>Step 1: Verify Your Phone Number</h2>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number (10 digits)</label>
                  <div className="phone-input-wrapper">
                    <span className="country-code">+91</span>
                    <input
                      id="phone"
                      type="text"
                      inputMode="numeric"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={otpSent}
                      maxLength="10"
                      required
                    />
                  </div>
                  <small className="form-hint">We will send an OTP to this number</small>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || !validatePhoneNumber(phoneNumber)}
                    className="btn btn-primary btn-send-otp"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <div className="form-group">
                      <label htmlFor="otp">Enter OTP (6 digits)</label>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength="6"
                        disabled={otpVerified}
                        required
                      />
                      <small className="form-hint">Check your SMS for the code</small>
                    </div>

                    <div className="otp-actions">
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || !otp || otp.length !== 6 || otpVerified}
                        className="btn btn-primary"
                      >
                        {loading ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={handleChangePhoneNumber}
                        className="btn btn-secondary"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Step 2: User Details (after OTP verified)
            <div className="registration-form">
              <div className="form-section">
                <div className="verified-badge">
                  ✓ Phone Verified: +91{phoneNumber}
                </div>

                <h2>Step 2: Complete Your Profile</h2>

                <div className="form-group">
                  <label htmlFor="userName">Full Name *</label>
                  <input
                    id="userName"
                    type="text"
                    placeholder="John Doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailId">Email Address *</label>
                  <input
                    id="emailId"
                    type="email"
                    placeholder="john@example.com"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group *</label>
                  <select
                    id="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode (6 digits) *</label>
                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={registrationLoading}
                  className="btn btn-primary btn-register"
                >
                  {registrationLoading ? 'Registering...' : 'Complete Registration'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpVerified(false)}
                  className="btn btn-secondary"
                >
                  Use Different Phone Number
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
