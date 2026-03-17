/**
 * OTP Service - Frontend
 * Handles OTP-related API calls with validation
 */
import axios from 'axios';
import { auth, RecaptchaVerifier } from '../firebase';
import { signInWithPhoneNumber } from 'firebase/auth';

const API_BASE_URL = '/api';

class OTPService {
  /**
   * Validate mobile number (10 digits)
   */
  static validateMobileNumber(phoneNumber) {
    return /^\d{10}$/.test(phoneNumber);
  }

  /**
   * Send OTP to mobile number
   * @param {string} phoneNumber - 10-digit mobile number
   * @returns {Promise}
   */
  static async sendOTP(phoneNumber) {
    try {
      if (!this.validateMobileNumber(phoneNumber)) {
        return {
          status: 0,
          message: 'Invalid phone number. Must be 10 digits.'
        };
      }

      // Default server flow (keeps compatibility): backend issues dev OTP or instructs client
      const response = await axios.post(`${API_BASE_URL}/otp/send`, { phoneNumber }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        status: 0,
        message: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      };
    }
  }

  /**
   * Verify OTP code
   * @param {string} phoneNumber - 10-digit mobile number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise}
   */
  static async verifyOTP(phoneNumber, otp) {
    try {
      if (!this.validateMobileNumber(phoneNumber)) {
        return {
          status: 0,
          message: 'Invalid phone number.'
        };
      }

      if (!/^\d{6}$/.test(otp)) {
        return {
          status: 0,
          message: 'OTP must be 6 digits.'
        };
      }

      // Default server-side verification (development fallback)
      const response = await axios.post(`${API_BASE_URL}/otp/verify`, { phoneNumber, otp }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        status: 0,
        message: error.response?.data?.message || 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /**
   * Check if phone number is verified
   * @param {string} phoneNumber - 10-digit mobile number
   * @returns {Promise}
   */
  static async checkVerificationStatus(phoneNumber) {
    try {
      const response = await axios.post(`${API_BASE_URL}/otp/check`, { phoneNumber }, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        status: 0,
        verified: false
      };
    }
  }

  /**
   * Initialize reCAPTCHA verifier for Firebase phone auth and send OTP via Firebase
   * @param {string} containerId - DOM element id to render reCAPTCHA (e.g., 'recaptcha-container')
   * @param {string} phoneNumber - E.164 formatted phone number (e.g., +919876543210)
   * @returns {Promise<{status: number, verificationId?: string, message?: string, confirmationResult?: object}>}
   */
  static async sendOTPViaFirebase(containerId, phoneNumber) {
    try {
      // Ensure auth and RecaptchaVerifier are available
      if (!auth) throw new Error('Firebase Auth not initialized');

      // Create or reuse a reCAPTCHA verifier
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(containerId, { size: 'invisible' }, auth);
      }

      const appVerifier = window.recaptchaVerifier;

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // confirmationResult can be used to confirm the code on the client
      return { status: 1, message: 'OTP sent via Firebase', confirmationResult };
    } catch (error) {
      console.error('Firebase sendOTP error:', error);
      return { status: 0, message: error.message || 'Failed to send OTP via Firebase' };
    }
  }

  /**
   * Confirm OTP on the client using the `confirmationResult` returned by `sendOTPViaFirebase`
   * and exchange for Firebase ID token to send to server for verification.
   * @param {object} confirmationResult - result from signInWithPhoneNumber
   * @param {string} code - 6-digit SMS code
   * @returns {Promise<{status:number, idToken?:string, message?:string}>}
   */
  static async confirmFirebaseOTPAndGetIdToken(confirmationResult, code) {
    try {
      const userCredential = await confirmationResult.confirm(code);
      const idToken = await userCredential.user.getIdToken();
      return { status: 1, idToken };
    } catch (error) {
      console.error('Firebase confirm error:', error);
      return { status: 0, message: error.message || 'Failed to verify OTP via Firebase' };
    }
  }
}

export default OTPService;
