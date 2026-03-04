const _ = require("lodash");

const Controller = require("../Base/Controller");
const Users = require('./Schema').Users;
const Model = require("../Base/Model");
const userProjection = require('../User/Projection')
const Globals = require("../../../configs/Globals");
const RequestBody = require("../../services/RequestBody");
const Authentication = require('../Authentication/Schema').Authtokens;
const CommonService = require("../../services/Common");
const admin = require("../../../configs/firebase");



class UsersController extends Controller {
    constructor() {
        super();
    }


    /********************************************************
   Purpose: user register
   Parameter:
      {
          "emailId":"john@doe.com",
          "password":"john",
          "userName": "John",
          "phoneNumber":"987654321",
          "role":"Donor",
          "bloodGroup":"A+",
          "pincode": "533435"
      }
   Return: JSON String
   ********************************************************/
    async register() {
        try {
            const data = this.req.body;

            if (
                !data.emailId ||
                !data.password ||
                !data.userName ||
                !data.phoneNumber ||
                !data.firebaseUid ||
                !data.idToken
            ) {
                return this.res.send({
                    status: 0,
                    message: "Missing required fields"
                });
            }

            if (!admin || !admin.apps.length) {
                return this.res.send({
                    status: 0,
                    message: "Firebase authentication service unavailable"
                });
            }

            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(data.idToken);
            } catch (err) {
                return this.res.send({
                    status: 0,
                    message: "Firebase authentication failed: Invalid or expired token"
                });
            }

            if (decodedToken.uid !== data.firebaseUid) {
                return this.res.send({
                    status: 0,
                    message: "Firebase UID mismatch"
                });
            }

            if (decodedToken.phone_number) {
                const tokenPhone = decodedToken.phone_number.replace("+91", "");
                if (tokenPhone !== data.phoneNumber) {
                    return this.res.send({
                        status: 0,
                        message: "Phone number mismatch"
                    });
                }
            }

            const existingEmail = await Users.findOne({
                emailId: data.emailId.toLowerCase(),
                isDeleted: false
            });

            if (!_.isEmpty(existingEmail)) {
                return this.res.send({
                    status: 0,
                    message: "Email already registered"
                });
            }

            // Check if user with this Firebase UID already exists
            const existingFirebaseUser = await Users.findOne({
                firebaseUid: data.firebaseUid,
                isDeleted: false
            });

            if (!_.isEmpty(existingFirebaseUser)) {
                return this.res.send({
                    status: 0,
                    message: "User account already exists with this phone number"
                });
            }

            const encryptedPassword = await new CommonService().ecryptPassword({
                password: data.password
            });

            const userData = {
                userName: data.userName,
                phoneNumber: data.phoneNumber,
                pincode: data.pincode,
                emailId: data.emailId.toLowerCase(),
                bloodGroup: data.bloodGroup,
                password: encryptedPassword,
                role: "Donor",
                firebaseUid: data.firebaseUid,
                isPhoneVerified: true
            };

            const newUserId = await new Model(Users).store(userData);

            return this.res.send({
                status: 1,
                message: "User registered successfully",
                userId: newUserId
            });

        } catch (error) {
            return this.res.send({
                status: 0,
                message: error.message || "Registration failed"
            });
        }
    }

    /********************************************************
    Purpose: Login
    Parameter:
        {
            "emailId":"john@doe.com"
            "password":"123456",
            
        }
    Return: JSON String
   ********************************************************/
    async login() {
        try {
            const user = await Users.findOne({
                emailId: this.req.body.emailId.toLowerCase(),
                isDeleted: false
            });

            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: "User not found" });
            }

            const valid = await new CommonService().verifyPassword({
                password: this.req.body.password,
                savedPassword: user.password
            });

            if (!valid) {
                return this.res.send({ status: 0, message: "Wrong password" });
            }

            let { token } = await new Globals().getToken({ id: user._id });

            return this.res.send({
                status: 1,
                message: "Login successful",
                access_token: token,
                data: user
            });

        } catch (error) {
            return this.res.send({ status: 0, message: "Login failed" });
        }
    }

    /********************************************************
    Purpose: Change Password
    Parameter:
        {
            "oldPassword":"password",
            "newPassword":"newpassword"
        }
    Return: JSON String
   ********************************************************/
    async changePassword() {
        try {
            const user = this.req.currentUser;
            if (user.password == undefined) {
                return this.res.send({ status: 0, message: "Unable to change password" });
            }
            let passwordObj = {
                oldPassword: this.req.body.oldPassword,
                newPassword: this.req.body.newPassword,
                savedPassword: user.password
            };
            let password = await (new CommonService()).changePasswordValidation({ passwordObj });
            if (typeof password.status !== 'undefined' && password.status == 0) {
                return this.res.send(password);
            }

            let updateData = { password: password };
            const updatedUser = await Users.findByIdAndUpdate(user._id, updateData, { new: true });
            return !updatedUser ? this.res.send({ status: 0, message: "Password not updated" }) : this.res.send({ status: 1, data: {}, message: "Password updated successfully" });

        } catch (error) {
            console.log("error- ", error);
            return this.res.send({ status: 0, message: error.message || 'An error occurred while changing password' });
        }
    }

    /********************************************************
    Purpose: Edit profile
    Parameter:
        {
            "emailId":"john@doe.com",
            "userName": "John",
            "phoneNumber":"987654321",
            "role":"Donor",
            "bloodGroup":"A+",
            "pincode": "533435",
            "userId":""
        }
    Return: JSON String
   ********************************************************/
    async editUserProfile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            let fieldsArray = ["emailId", "userName", "phoneNumber", "role", "bloodGroup", "pincode"];
            let data = await (new RequestBody()).processRequestBody(this.req.body, fieldsArray);

            let isExist = await Users.findOne({ _id: { $nin: [currentUser] }, emailId: data['emailId'] });
            if (isExist) {
                return this.res.send({ status: 0, message: "Duplicate emailId" });
            }
            const updatedUser = await Users.findByIdAndUpdate(currentUser, data, { new: true }).select(userProjection.user);
            return this.res.send({ status: 1, message: "User details updated successfully", data: updatedUser });
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'Server error' });
        }
    }

    /********************************************************
     Purpose: user details
     Parameter:
     {
        "uid": "5ad5d198f657ca54cfe39ba0"
     }
     Return: JSON String
     ********************************************************/
    async userProfile() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            let user = await Users.findOne({ _id: currentUser }, userProjection.user);
            return _.isEmpty(user) ? this.res.send({ status: 0, message: "User details not found" }) : this.res.send({ status: 1, data: user });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while fetching user profile' });
        }
    }

    /********************************************************
     Purpose: Logout User
     Parameter:
     {}
     Return: JSON String
     ********************************************************/
    async logout() {
        try {
            const currentUser = this.req.currentUser ? this.req.currentUser : {};
            if (currentUser && currentUser._id) {
                let params = { token: null };
                let filter = { userId: currentUser._id };
                await Authentication.findOneAndUpdate(filter, params);
                this.res.send({ status: 1, message: "User logged out successfully" });
            } else {
                return this.res.send({ status: 0, message: "User details not found" });
            }

        } catch (error) {
            console.log('error', error);
            this.res.send({ status: 0, message: error.message || 'An error occurred during logout' });
        }

    }
    async saveFcmToken() {
  try {
    const userId = this.req.currentUser._id;
    const { fcmToken } = this.req.body;

    if (!fcmToken) {
      return this.res.send({
        status: 0,
        message: "FCM token missing",
      });
    }

    await Users.findByIdAndUpdate(userId, {
      fcmToken,
    });

    return this.res.send({
      status: 1,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    return this.res.send({
      status: 0,
      message: "Failed to save FCM token",
    });
  }
}

async sendTestNotification() {
  try {
    const user = await Users.findById(this.req.currentUser._id);

    if (!user.fcmToken) {
      return this.res.send({ status: 0, message: "No FCM token found" });
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: "🩸 Blood Donation Alert",
        body: "This is a test notification from backend!",
      },
    });

    return this.res.send({ status: 1, message: "Notification sent successfully" });

  } catch (error) {
    console.error(error);
    return this.res.send({ status: 0, message: "Notification failed" });
  }
}


}
module.exports = UsersController;