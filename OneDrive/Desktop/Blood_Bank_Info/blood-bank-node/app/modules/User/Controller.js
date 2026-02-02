const _ = require("lodash");

const Controller = require("../Base/Controller");
const Users = require('./Schema').Users;
const Model = require("../Base/Model");
const userProjection = require('../User/Projection')
const Globals = require("../../../configs/Globals");
const RequestBody = require("../../services/RequestBody");
const Authentication = require('../Authentication/Schema').Authtokens;
const CommonService = require("../../services/Common");


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
            // check emailId is exist or not
            let filter = { "emailId": this.req.body.emailId.toLowerCase() };
            const user = await Users.findOne(filter);

            //if user exist give error
            if (!_.isEmpty(user) && (user.emailId || user.userName)) {
                return this.res.send({ status: 0, message: "Duplicate emailId" });
            } else {
                let data = this.req.body;
                let password = await (new CommonService()).ecryptPassword({ password: data['password'] });
                data = { ...data, password: password, role: 'Donor' };
                data['emailId'] = data['emailId'].toLowerCase();

                // save new user
                const newUserId = await new Model(Users).store(data);

                // if empty not save user details and give error message.
                if (_.isEmpty(newUserId)) {
                    return this.res.send({ status: 0, message: "User details not saved" })
                }
                else {
                    return this.res.send({ status: 1, message: "User successfully registered" });
                }

            }
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred during registration' });
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
            let fieldsArray = ["emailId", "password"];
            let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send proper data" + " " + emptyFields.toString() + " fields required." });
            }

            let data = await (new RequestBody()).processRequestBody(this.req.body, ["deviceToken", "device"]);
            const user = await Users.findOne({ emailId: this.req.body.emailId.toString().toLowerCase(), isDeleted: false });

            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: "User details not found" });
            }
            const status = await (new CommonService()).verifyPassword({ password: this.req.body.password, savedPassword: user.password });
            if (!status) {
                return this.res.send({ status: 0, message: "Wrong password" });
            }

            data['lastSeen'] = new Date();
            let updatedUser = await Users.findByIdAndUpdate(user._id, data, { new: true }).select(userProjection.user);
            let { token } = await new Globals().getToken({ id: user._id });
            return this.res.send({ status: 1, message: "User logged in successfully", access_token: token, data: updatedUser });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: i18n.__('SERVER_ERROR') });
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

}
module.exports = UsersController;