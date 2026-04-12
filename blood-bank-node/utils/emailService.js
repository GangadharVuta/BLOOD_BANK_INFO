/**
 * ============================================
 * EMAIL SERVICE UTILITY
 * ============================================
 * Sends emails for password reset, notifications, etc.
 * Uses Nodemailer for SMTP
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
let transporter;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    logger.warn('Email service not configured - SMTP credentials missing');
  }
} catch (error) {
  logger.error('Failed to initialize email service:', error.message);
}

/**
 * Send password reset OTP email
 */
exports.sendPasswordResetEmail = async (email, otp, expiryMinutes = 10) => {
  try {
    if (!transporter) {
      logger.error('Email service not available');
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '🔐 Blood Bank - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Password Reset Request</h1>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #eee;">
            <p>Hello,</p>
            
            <p>You requested to reset your Blood Bank password. Use the OTP below to reset your password:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin: 0;">${otp}</h2>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              ⏰ This OTP is valid for <strong>${expiryMinutes} minutes</strong>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              ⚠️ If you didn't request this, please ignore this email or contact support.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Blood Bank App. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent', { email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error: error.message });
    return false;
  }
};

/**
 * Send OTP verification email
 */
exports.sendOtpVerificationEmail = async (email, otp) => {
  try {
    if (!transporter) {
      logger.error('Email service not available');
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '✅ Blood Bank - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Email Verification</h1>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #eee;">
            <p>Hello,</p>
            
            <p>Welcome to Blood Bank! Verify your email using the OTP below:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin: 0;">${otp}</h2>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              ⏰ This OTP is valid for <strong>10 minutes</strong>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Verification email sent', { email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send verification email', { email, error: error.message });
    return false;
  }
};

/**
 * Send donation notification email
 */
exports.sendDonationNotificationEmail = async (email, donorName, donationType) => {
  try {
    if (!transporter) {
      logger.error('Email service not available');
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '🩸 Blood Bank - Donation Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>🩸 Donation Notification</h1>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #eee;">
            <p>Hello ${donorName},</p>
            
            <p>Thank you for your ${donationType} donation! Your contribution has been recorded in the Blood Bank system.</p>
            
            <p>Your donation helps save lives. We appreciate your generosity!</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Donation notification email sent', { email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send donation notification email', { email, error: error.message });
    return false;
  }
};

module.exports = exports;
