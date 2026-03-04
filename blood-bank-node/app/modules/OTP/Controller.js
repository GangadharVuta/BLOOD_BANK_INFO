/**************************
 OTP CONTROLLER
 **************************/
const crypto = require('crypto');
const admin = require('firebase-admin');
const _ = require('lodash');
const Controller = require('../Base/Controller');
const { OTP } = require('./Schema');
const CommonService = require('../../services/Common');

class OTPController extends Controller {
    constructor() {
        super();
        // Initialize Firebase Admin SDK (expects service account JSON in env)
        if (!admin.apps.length) {
            const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
            try {
                if (svcJson) {
                    const parsed = JSON.parse(svcJson);
                    admin.initializeApp({ credential: admin.credential.cert(parsed) });
                } else if (svcPath) {
                    const serviceAccount = require(svcPath);
                    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                } else {
                    console.warn('Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH in env.');
                }
            } catch (e) {
                console.error('Failed to initialize Firebase Admin SDK:', e);
            }
        }
    }

    /********************************************************
    Purpose: Send OTP to mobile number
    Parameter: {
        "phoneNumber": "9876543210"
    }
    Return: JSON { status: 1, message: "OTP sent", messageId: "..." }
    ********************************************************/
    async sendOTP() {
        try {
            const { phoneNumber } = this.req.body;

            // Validate phone number
            if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
                return this.res.send({ 
                    status: 0, 
                    message: "Invalid phone number. Must be 10 digits." 
                });
            }

            // Delete any existing unverified OTPs for this number (dev/testing)
            await OTP.deleteMany({ phoneNumber, verified: false });

            // Generate random 6-digit OTP for development/testing only
            const otp = crypto.randomInt(100000, 999999).toString();

            // Save OTP to database for development/testing flows
            const otpDoc = await OTP.create({ phoneNumber, otp, verified: false, attempts: 0 });

            // Check if we're in development mode
            const isDevelopment = process.env.NODE_ENV === 'Development';

            if (isDevelopment) {
                // Development mode: Log OTP to console
                console.log(`[DEV MODE] OTP for ${phoneNumber}: ${otp}`);
                return this.res.send({
                    status: 1,
                    message: `[DEV MODE] OTP sent successfully. Check console for OTP code.`,
                    messageId: "DEV_MODE_" + otpDoc._id,
                    expiresIn: 600,
                    devOtp: otp  // For testing only
                });
            }

            // Production mode: Use Firebase Auth phone verification on client
            // Server does not send SMS directly. Client should use Firebase JS SDK
            // to initiate phone verification and then send the ID token to server
            // for verification. Provide minimal guidance in the response.
            return this.res.send({
                status: 1,
                message: "Production: use Firebase Auth on the client to send/verify OTP. Send the Firebase ID token to the server for verification.",
                firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
                expiresIn: 600
            });

        } catch (error) {
            console.error('Error in sendOTP:', error);
            return this.res.send({
                status: 0,
                message: "An error occurred while sending OTP. Please try again."
            });
        }
    }

    /********************************************************
    Purpose: Verify OTP
    Parameter: {
        "phoneNumber": "9876543210",
        "otp": "123456"
    }
    Return: JSON { status: 1, message: "OTP verified", verified: true }
    ********************************************************/
    async verifyOTP() {
        try {
            const { idToken, phoneNumber, otp } = this.req.body;

            // If client provided a Firebase ID token, verify with Firebase Admin
            if (idToken) {
                try {
                    const decoded = await admin.auth().verifyIdToken(idToken);
                    // decoded.phone_number contains the verified phone number (+<countrycode>...)
                    return this.res.send({
                        status: 1,
                        message: 'Phone verified via Firebase ID token',
                        verified: true,
                        phoneNumber: decoded.phone_number || phoneNumber,
                        firebaseUid: decoded.uid
                    });
                } catch (fbErr) {
                    console.error('Firebase token verify error:', fbErr);
                    return this.res.send({ status: 0, message: 'Invalid or expired Firebase ID token.' });
                }
            }

            // Fallback: support development OTP verification using stored OTPs
            if (process.env.NODE_ENV === 'Development' && otp) {
                if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
                    return this.res.send({ status: 0, message: 'Invalid phone number.' });
                }

                if (!otp || !/^\d{6}$/.test(otp)) {
                    return this.res.send({ status: 0, message: 'Invalid OTP format.' });
                }

                const otpRecord = await OTP.findOne({ phoneNumber, verified: false, expiresAt: { $gt: new Date() } });
                if (!otpRecord) return this.res.send({ status: 0, message: 'OTP expired or not found.' });

                if (otpRecord.attempts >= 5) {
                    await OTP.deleteOne({ _id: otpRecord._id });
                    return this.res.send({ status: 0, message: 'Maximum attempts exceeded.' });
                }

                if (otpRecord.otp !== otp) {
                    otpRecord.attempts += 1;
                    await otpRecord.save();
                    return this.res.send({ status: 0, message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` });
                }

                otpRecord.verified = true;
                await otpRecord.save();
                return this.res.send({ status: 1, message: 'OTP verified (dev)', verified: true, phoneNumber });
            }

            return this.res.send({ status: 0, message: 'No verification token provided.' });

        } catch (error) {
            console.error('Error in verifyOTP:', error);
            return this.res.send({
                status: 0,
                message: "An error occurred during OTP verification."
            });
        }
    }

    /********************************************************
    Purpose: Check if phone number is verified
    Parameter: {
        "phoneNumber": "9876543210"
    }
    Return: JSON { status: 1, verified: true/false }
    ********************************************************/
    async checkVerificationStatus() {
        try {
            const { phoneNumber } = this.req.body;

            if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
                return this.res.send({
                    status: 0,
                    message: "Invalid phone number."
                });
            }

            const otpRecord = await OTP.findOne({
                phoneNumber,
                verified: true,
                expiresAt: { $gt: new Date() }
            });

            return this.res.send({
                status: 1,
                verified: !!otpRecord,
                phoneNumber: phoneNumber
            });

        } catch (error) {
            console.error('Error in checkVerificationStatus:', error);
            return this.res.send({
                status: 0,
                message: "An error occurred."
            });
        }
    }
}

module.exports = OTPController;
