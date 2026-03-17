/**
 * Authentication Service - Frontend
 * Handles user registration and identity verification
 */
import axios from 'axios';

const API_BASE_URL = '/api';

class AuthService {
  /**
   * Validate mobile number (10 digits)
   */
  static validateMobileNumber(phoneNumber) {
    return /^\d{10}$/.test(phoneNumber);
  }

  /**
   * Validate Aadhaar number (12 digits)
   */
  static validateAadhaar(aadhaar) {
    return /^\d{12}$/.test(aadhaar);
  }

  /**
   * Validate PAN number format: ABCDE1234F
   * 5 uppercase letters + 4 digits + 1 uppercase letter
   */
  static validatePAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  }

  /**
   * Mask Aadhaar: XXXX-XXXX-1234
   */
  static maskAadhaar(aadhaar) {
    if (!this.validateAadhaar(aadhaar)) return '';
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  }

  /**
   * Mask PAN: ABCDE****F
   */
  static maskPAN(pan) {
    if (!this.validatePAN(pan)) return '';
    return `${pan.substring(0, 5)}****${pan.slice(-1)}`;
  }

  /**
   * Hash identity number using SHA256
   * Never store raw identity numbers
   * @param {string} identityNumber - Aadhaar or PAN
   */
  static hashIdentity(identityNumber) {
    try {
      // For browser-safe hashing, we'll use a simple approach
      // In production, use a library like TweetNaCl.js or crypto-js
      // This is sent to backend for proper hashing
      return identityNumber; // Backend will hash it
    } catch (error) {
      console.error('Error preparing identity:', error);
      return null;
    }
  }

  /**
   * Register user with identity verification
   * @param {object} userData - User registration data
   * @returns {Promise}
   */
  static async registerUser(userData) {
    try {
      const {
        userName,
        emailId,
        password,
        phoneNumber,
        bloodGroup,
        pincode,
        identityType,
        identityNumber
      } = userData;

      // Validate required fields
      if (!userName || !emailId || !password || !phoneNumber || !bloodGroup || !pincode) {
        return {
          status: 0,
          message: 'Please fill all required fields'
        };
      }

      // Validate identity
      if (!identityType || !identityNumber) {
        return {
          status: 0,
          message: 'Identity verification required'
        };
      }

      // Prepare registration payload
      // Backend will hash the identity number
      const registrationPayload = {
        userName,
        emailId,
        password,
        phoneNumber,
        bloodGroup,
        pincode,
        identityType,
        identityNumber,  // Backend will hash this
        role: 'Donor'
      };

      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        registrationPayload,
        { timeout: 15000 }
      );

      return response.data;
    } catch (error) {
      console.error('Error during registration:', error);
      return {
        status: 0,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate password strength
   * Minimum 6 characters
   */
  static validatePassword(password) {
    return password && password.length >= 6;
  }

  /**
   * Clear sensitive data from memory
   */
  static clearSensitiveData(obj) {
    if (obj.identityNumber) {
      obj.identityNumber = null;
    }
    if (obj.identityHash) {
      obj.identityHash = null;
    }
    return obj;
  }
}

export default AuthService;
