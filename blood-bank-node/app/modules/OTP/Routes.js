/**************************
 OTP ROUTES
 **************************/
const rateLimit = require('express-rate-limit');

module.exports = (app, express) => {
    const router = express.Router();
    const OTPController = require('../OTP/Controller');
    const config = require('../../../configs/configs');

    // Rate limiting for OTP endpoints
    const otpLimiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 5, // 5 requests per 5 minutes
        message: 'Too many OTP requests. Please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const verifyLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 5, // 5 verify attempts per minute
        message: 'Too many verification attempts. Please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    /**
     * POST /api/otp/send
     * Send OTP to mobile number
     */
    router.post('/otp/send', otpLimiter, (req, res, next) => {
        const otpObj = (new OTPController()).boot(req, res);
        return otpObj.sendOTP();
    });

    /**
     * POST /api/otp/verify
     * Verify OTP code
     */
    router.post('/otp/verify', verifyLimiter, (req, res, next) => {
        const otpObj = (new OTPController()).boot(req, res);
        return otpObj.verifyOTP();
    });

    /**
     * POST /api/otp/check
     * Check if phone number is verified
     */
    router.post('/otp/check', (req, res, next) => {
        const otpObj = (new OTPController()).boot(req, res);
        return otpObj.checkVerificationStatus();
    });

    app.use(config.baseApiUrl, router);
};
