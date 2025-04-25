/****************************
 Common services
 ****************************/
const _ = require("lodash");
const bcrypt = require('bcrypt');
class Common {

    /********************************************************
    Purpose: Encrypt password
    Parameter:
        {
            "data":{
                "password" : "test123"
            }
        }
    Return: JSON String
    ********************************************************/
    ecryptPassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (data && data.password) {
                    let password = bcrypt.hashSync(data.password, 10);
                    return resolve(password);
                }
                return resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    /********************************************************
    Purpose: Compare password
    Parameter:
        {
            "data":{
                "password" : "Buffer data", // Encrypted password
                "savedPassword": "Buffer data" // Encrypted password
            }
        }
    Return: JSON String
    ********************************************************/
    verifyPassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let isVerified = false;
                if (data && data.password && data.savedPassword) {
                    var base64data = Buffer.from(data.savedPassword, 'binary').toString();
                    isVerified = await bcrypt.compareSync(data.password, base64data)
                }
                return resolve(isVerified);
            } catch (error) {
                reject(error);
            }
        });
    }
    /********************************************************
     Purpose: Change password validations
     Parameter:
     {
     }
     Return: JSON String
    ********************************************************/
    changePasswordValidation(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let passwordObj = data.passwordObj ? data.passwordObj : {}
                const samePassword = _.isEqual(passwordObj.oldPassword, passwordObj.newPassword);
                if (samePassword) {
                    return resolve({ status: 0, message: "Old password should be different from new password" });
                }

                const status = await this.verifyPassword({ password: passwordObj.oldPassword, savedPassword: passwordObj.savedPassword });
                if (!status) {
                    return resolve({ status: 0, message: "Please pass proper password" });
                }
                let password = await this.ecryptPassword({ password: passwordObj.newPassword });
                return resolve(password);
            } catch (error) {
                return reject(error);
            }
        });
    }
}

module.exports = Common;