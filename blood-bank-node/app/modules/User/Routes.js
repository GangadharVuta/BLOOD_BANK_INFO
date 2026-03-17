
module.exports = (app, express) => {

    const router = express.Router();

    const Globals = require("../../../configs/Globals");
    const UsersController = require('../User/Controller');
    const config = require('../../../configs/configs');
    

    router.post('/users/register', (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.register();
    });

    router.post('/users/login', (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.login();
    });

    router.post('/users/changePassword', Globals.isAuthorised, (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.changePassword();
    });

    router.post('/users/updateUserProfile', Globals.isAuthorised, (req, res, next) => {
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
    
    router.post('/users/forgot-password-send-otp', (req, res, next) => {
        const userObj = (new UsersController()).boot(req, res);
        return userObj.forgotPasswordSendOtp();
    });

    router.post('/users/reset-password', (req, res, next) => {
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