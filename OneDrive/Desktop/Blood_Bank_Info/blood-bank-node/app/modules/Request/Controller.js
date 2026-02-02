const _ = require("lodash");
const { ObjectId } = require('mongodb');

const Controller = require("../Base/Controller");
const Requests = require('./Schema').Requests;
const Users = require('../User/Schema').Users;
const Model = require("../Base/Model");
const userProjection = require('../User/Projection')
const RequestBody = require("../../services/RequestBody");
require('dotenv').config(); // Make sure this line is near the top

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);


class RequestsController extends Controller {
    constructor() {
        super();
    }


    /********************************************************
   Purpose: Get donars list
   Parameter:
      {
          "pincode":"533435",
          "bloodGroup":"A+"
      }
   Return: JSON String
   ********************************************************/
    async getDonorsList() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const data = this.req.body;
            let query = [{ _id: { $nin: [currentUser] } }];
            if (data?.pincode) {
                query.push({ pincode: data.pincode })
            }
            if (data?.bloodGroup && data?.bloodGroup != "any") {
                query.push({ bloodGroup: data.bloodGroup })
            }
            let donors = await Users.find({ $and: query }, userProjection.user);
            return _.isEmpty(donors) ? this.res.send({ status: 0, message: "Donor details not found" }) : this.res.send({ status: 1, data: donors });
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while fetching donors list' });
        }

    }

    /********************************************************
     Purpose: request donars
     Parameter:
        {
            "userIds": [],
            "bloodGroup":"A+",
            "pincode": "533435",
            "address": "address"
        }
     Return: JSON String
     ********************************************************/
    async requestDonors() {
        try {
            let fieldsArray = ["userIds", "bloodGroup", "pincode", "address"];
            let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send proper data" + " " + emptyFields.toString() + " fields required." });
            }
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            let data = this.req.body;
            if (data.userIds.length > 0) {
                const requestsCount = await Requests.aggregate([
                    { $match: { isDeleted: false } },
                    {
                        $group: {
                            _id: "$requestId",
                            requestId: { "$first": "$_id" }
                        }
                    },
                    {
                        $project: {
                            requestId: "$_id",
                            _id: 0
                        }
                    },
                ])
                for (let i = 0; i < data.userIds.length; i++) {
                    const donarObj = {
                        requestedBy: currentUser,
                        donorId: data.userIds[i],
                        pincode: data.pincode,
                        address: data.address,
                        requestId: "BCREQ" + requestsCount.length
                    }
                    const request = await new Model(Requests).store(donarObj);
                    const user = await Users.findOne({ _id: data.userIds[i] }, userProjection.user)
                    const acceptUrl = `http://localhost:4000/api/requests/accept/${request.requestId}/donor/${data.userIds[i]}`
                    const rejectUrl = `http://localhost:4000/api/requests/reject/${request.requestId}/donor/${data.userIds[i]}`
                    console.log(`acceptUrl: ${acceptUrl}`);
                    console.log(`rejectUrl: ${rejectUrl}`);
                    await client.messages
                        .create({
                            from: 'whatsapp:+14155238886', // Twilio sandbox number
                            to: `whatsapp:+91${user.phoneNumber}`,
                            body: `🩸 Blood Donation Request 🩸\n\nDear ${user.UserName},\n\nWe need a donor with blood group *${data.bloodGroup}* at ${data.Address}.\n\nWould you like to help? Please choose an option below.`,
                            persistentAction: [
                                `https://wa.me/?text=Accept&redirect_uri=${encodeURIComponent(acceptUrl)}`,
                                `https://wa.me/?text=Reject&redirect_uri=${encodeURIComponent(rejectUrl)}`
                            ]
                        })
                        .then(message => console.log(message.sid))
                        .catch(err => console.error(err));

                }
            }
            return this.res.send({ status: 1, message: "Request send successfully" });
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while sending requests' });
        }
    }

    /********************************************************
    Purpose: accept request
    Parameter: Params (requestId, donorId)
    Return: JSON String
    ********************************************************/
    async acceptRequest() {
        try {
            const { requestId, donorId } = this.req.params;
            const updatedRequest = await Requests.findOneAndUpdate({ donorId, requestId: requestId }, { isAcceptedByUser: true });
            const requester = await Users.findOne({ _id: updatedRequest.requestedBy }, userProjection.user)
            const user = await Users.findOne({ _id: donorId }, userProjection.user)
            const message = `
                🩸 New Donor Available 🩸
                A new donor has shown interest in helping.
                👤 Name: ${user.UserName}
                🩸 Blood Group: ${user.bloodGroup}
                📞 Contact: ${user.phoneNumber}
                `;
            await client.messages
                .create({
                    from: 'whatsapp:+14155238886', // Twilio sandbox number
                    to: `whatsapp:+91${requester.phoneNumber}`,
                    body: message
                })
                .then(message => console.log(message.sid))
                .catch(err => console.error(err));
            return this.res.send({ status: 1, message: "Donor accepted" })
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while accepting request' });
        }
    }

    /********************************************************
    Purpose: reject request
    Parameter: Params (requestId, donorId)
    Return: JSON String
    ********************************************************/
    async rejectRequest() {
        try {
            const { requestId, donorId } = this.req.params;
            await Requests.findOneAndUpdate({ donorId, requestId: requestId }, { isRejectedByUser: true });
            return this.res.send({ status: 1, message: "Donor rejected" })
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while rejecting request' });
        }
    }

    /********************************************************
    Purpose: cancel request
    Parameter: Params (requestId)
    Return: JSON String
    ********************************************************/
    async cancelRequest() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const { requestId } = this.req.params;
            await Requests.updateMany({ requestId: requestId, requestedBy: currentUser }, { $set: { isDeleted: true } }, { upsert: true, new: true });
            return this.res.send({ status: 1, message: "Cancelled request" })
        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while cancelling request' });
        }
    }

    /********************************************************
    Purpose: get donors list for requests
    Parameter: 
    {
        "requestIds": [],
        "status": "pending" or "accepted" or "rejected" or "cancelled"
    }
    Return: JSON String
    ********************************************************/
    async getDonorsListForRequests() {
        try {
            let fieldsArray = ["status"];
            let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: "Please send proper data" + " " + emptyFields.toString() + " fields required." });
            }
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const data = this.req.body;
            let query = [{ requestedBy: currentUser }];
            if (data.requestIds) {
                query.push({ requestId: { $in: data.requestIds } })
            }
            if (data.status) {
                if (data.status == "accepted") {
                    query.push({ isAcceptedByUser: true, isRejectedByUser: false, isDeleted: false })
                } else if (data.status == "rejected") {
                    query.push({ isAcceptedByUser: false, isRejectedByUser: true, isDeleted: false })
                } else if (data.status == "cancelled") {
                    query.push({ isDeleted: true })
                } else {
                    query.push({ isAcceptedByUser: false, isRejectedByUser: false, isDeleted: false })
                }
            }
            console.log(`query: ${JSON.stringify(query)}`)
            let requests = await Requests.aggregate([
                { $match: { $and: query } },
                {
                    $lookup: {
                        from: "users",
                        localField: "donorId",
                        foreignField: "_id",
                        as: "users"
                    }
                },
                { "$unwind": "$users" },
                {
                    $project: {
                        requestId: "$requestId",
                        userId: "$users._id",
                        userName: "$users.userName",
                        phoneNumber: "$users.phoneNumber",
                        pincode: "$users.pincode",
                        bloodGroup: "$users.bloodGroup"
                    }
                },
                { $sort: { _id: -1 } }
            ])
            return _.isEmpty(requests) ? this.res.send({ status: 0, message: "Request details not found" }) : this.res.send({ status: 1, data: requests });

        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while fetching requests' });
        }
    }

    /********************************************************
   Purpose: get request ids
   Parameter:
   Return: JSON String
   ********************************************************/
    async getRequestIds() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            console.log(`currentUser: ${currentUser}`)
            let requests = await Requests.aggregate([
                { $match: { requestedBy: new ObjectId(currentUser) } },
                {
                    $group: {
                        _id: "$requestId",
                        requestId: { "$first": "$_id" }
                    }
                },
                {
                    $project: {
                        requestId: "$_id",
                        _id: 0
                    }
                }, { $sort: { createdAt: 1 } }
            ]);
            return _.isEmpty(requests) ? this.res.send({ status: 0, message: "Request details not found" }) : this.res.send({ status: 1, data: requests });

        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while fetching request IDs' });
        }
    }
}
module.exports = RequestsController;