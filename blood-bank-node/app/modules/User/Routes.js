
const rateLimit = require('express-rate-limit');
const validation = require('../../../middleware/validation');
const validators = require('../../../utils/validators');

module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const UsersController = require('../User/Controller');
    const config = require('../../../configs/configs');
    
    // ======= RATE LIMITING FOR AUTH ENDPOINTS =======
    // Prevent brute force attacks
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Max 5 attempts per 15 minutes
        message: 'Too many login attempts. Please try again after 15 minutes.',
        standardHeaders: true, // Return rate limit info in RateLimit-* headers
        legacyHeaders: false
    });

    const registerLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // Max 3 registrations per hour per IP
        message: 'Too many accounts created from this IP. Please try again after 1 hour.',
        standardHeaders: true,
        legacyHeaders: false
    });

    const passwordResetLimiter = rateLimit({
        windowMs: 30 * 60 * 1000, // 30 minutes
        max: 3, // Max 3 password reset attempts per 30 minutes
        message: 'Too many password reset attempts. Please try again after 30 minutes.',
        standardHeaders: true,
        legacyHeaders: false
    });

    router.post('/users/register', registerLimiter, validation.validateRegister, validators.validatePasswordStrengthMiddleware('password'), (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.register();
    });

    router.post('/users/login', loginLimiter, validation.validateLogin, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.login();
    });

    router.post('/users/changePassword', Globals.isAuthorised, validators.validatePasswordStrengthMiddleware('newPassword'), (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.changePassword();
    });

    router.post('/users/updateUserProfile', Globals.isAuthorised, validation.validateProfileUpdate, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.editUserProfile();
    });

    router.get('/users/profile', Globals.isAuthorised, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.userProfile();
    });

    router.get('/users/logout', Globals.isAuthorised, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.logout();

    });
    
    router.post('/users/forgot-password-send-otp', passwordResetLimiter, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.forgotPasswordSendOtp();
    });

    router.post('/users/reset-password', passwordResetLimiter, validators.validatePasswordStrengthMiddleware('newPassword'), (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.resetPassword();
    });
    
    router.post(
  "/users/save-fcm-token",
  Globals.isAuthorised,
  (req, res, next) => {
    const userObj = (new UsersController()).boot(req, res);
    return userObj.saveFcmToken();
  }
);

router.post(
  "/notifications/send-test",
  Globals.isAuthorised,
  (req, res, next) => {
    const userObj = (new UsersController()).boot(req, res);
    return userObj.sendTestNotification();
  }
);



    app.use(config.baseApiUrl, router);
}