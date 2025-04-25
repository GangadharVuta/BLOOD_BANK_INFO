/****************************
 SECURITY TOKEN HANDLING
 ****************************/
const _ = require('lodash');
const Moment = require('moment');
let jwt = require('jsonwebtoken')

const config = require('./configs');
const Authentication = require('../app/modules/Authentication/Schema').Authtokens;
const Users = require('../app/modules/User/Schema').Users;

class Globals {

    // Generate Token
    getToken(params) {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate Token
                let token = jwt.sign({
                    id: params.id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                params.token = token;
                params.userId = params.id;
                params.tokenExpiryTime = Moment().add(parseInt(config.tokenExpirationTime), 'minutes');
                delete params.id;
                await Authentication.findOneAndUpdate({ userId: params.userId }, params, { upsert: true, new: true });
                return resolve({ token });
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }
        });
    }

    generateToken(id) {
        return new Promise(async (resolve, reject) => {
            try {
                let token = jwt.sign({
                    id: id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
                }, config.securityToken);

                return resolve(token);
            } catch (err) {
                console.log("Get token", err);
                return reject({ message: err, status: 0 });
            }

        });
    }
    // Validating Token
    static async isAuthorised(req, res, next) {
        try {
            const token = req.headers.authorization;
            if (!token) return res.status(401).json({ status: 0, message: "Please send authorization token" });

            const authenticate = new Globals();

            const tokenCheck = await authenticate.checkTokenInDB(token);
            if (!tokenCheck) return res.status(401).json({ status: 0, message: "Invalid token" });

            const tokenExpire = await authenticate.checkExpiration(token);
            if (!tokenExpire) return res.status(401).json({ status: 0, message: "Token expired" });

            const userExist = await authenticate.checkUserInDB(token);
            if (!userExist) return res.status(401).json({ status: 0, message: "User details not found" });

            if (userExist._id) {
                req.currentUser = userExist;
            }
            next();
        } catch (err) {
            console.log("Token authentication", err);
            return res.send({ status: 0, message: err });
        }
    }
    // Check User Existence in DB
    checkUserInDB(token) {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialisation of variables
                let decoded = jwt.decode(token);
                if (!decoded) { return resolve(false); }
                let userId = decoded.id

                const user = await Users.findOne({ _id: userId, isDeleted: false });
                if (user) return resolve(user);
                return resolve(false);

            } catch (err) {
                console.log("Check user in db")
                return reject({ message: err, status: 0 });
            }

        })
    }
    // Check token in DB
    checkTokenInDB(token) {
        return new Promise(async (resolve, reject) => {
            try {
                let tokenDetails = Buffer.from(token, 'binary').toString();
                // Initialisation of variables
                var decoded = jwt.verify(tokenDetails, config.securityToken, { ignoreExpiration: true });
                if (!decoded) { return resolve(false); }

                const authenticate = await Authentication.findOne({ token: tokenDetails });
                if (authenticate) return resolve(true);
                return resolve(false);
            } catch (err) {
                console.log("Check token in db", err)
                return resolve({ message: err, status: 0 });
            }
        })
    }
    // Check Token Expiration
    checkExpiration(token) {
        return new Promise(async (resolve, reject) => {
            let tokenDetails = Buffer.from(token, 'binary').toString();
            let status = false;
            const authenticate = await Authentication.findOne({ token: tokenDetails });
            if (authenticate && authenticate.tokenExpiryTime) {
                let expiryDate = Moment(authenticate.tokenExpiryTime, 'YYYY-MM-DD HH:mm:ss')
                let now = Moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
                if (expiryDate > now) { status = true; resolve(status); }
            }
            resolve(status);
        })
    }
}

module.exports = Globals;
