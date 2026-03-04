const _ = require("lodash");
const { ObjectId } = require('mongodb');

const Controller = require("../Base/Controller");
const Requests = require('./Schema').Requests;
const Users = require('../User/Schema').Users;
const Donors = require('../Donor/Schema').Donors; // added import for manually added donors
const Model = require("../Base/Model");
const userProjection = require('../User/Projection')
const RequestBody = require("../../services/RequestBody");
require('dotenv').config(); // Make sure this line is near the top

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
try {
    // Attempt to initialize Twilio only if the package is available and configured
    if (accountSid && authToken) {
        client = require('twilio')(accountSid, authToken);
    }
} catch (e) {
    console.warn('Twilio package not available or not configured; using mock client.');
}

if (!client) {
    client = {
        messages: {
            create: (opts) => {
                console.warn('Twilio disabled - message not sent. Payload:', opts);
                return Promise.resolve({ sid: 'MOCK' });
            }
        }
    };
}


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
                    // when sending notifications we may have selected a donor from either Users or Donors collection
                    let donorRecord = await Users.findOne({ _id: data.userIds[i] }, userProjection.user);
                    let isManual = false;
                    if (!donorRecord) {
                        donorRecord = await Donors.findById(data.userIds[i]);
                        isManual = true;
                    }

                    // Null check before accessing donor properties
                    if (!donorRecord) {
                        console.warn(`Donor ${data.userIds[i]} not found in Users or Donors, skipping notification`);
                        continue;
                    }

                    const acceptUrl = `http://localhost:4000/api/requests/accept/${request.requestId}/donor/${data.userIds[i]}`;
                    const rejectUrl = `http://localhost:4000/api/requests/reject/${request.requestId}/donor/${data.userIds[i]}`;
                    console.log(`acceptUrl: ${acceptUrl}`);
                    console.log(`rejectUrl: ${rejectUrl}`);

                    // Safe WhatsApp message construction with fallback values
                    const donorName = donorRecord.userName || donorRecord.UserName || donorRecord.name || 'Donor';
                    const bloodGroup = data.bloodGroup || 'Unknown';
                    const address = data.address || 'your location';
                    const phoneNumber = donorRecord.phoneNumber || donorRecord.phone;

                    await client.messages
                        .create({
                            from: 'whatsapp:+14155238886', // Twilio sandbox number
                            to: `whatsapp:+91${phoneNumber}`,
                            body: `🩸 Blood Donation Request 🩸\n\nDear ${donorName},\n\nWe need a donor with blood group *${bloodGroup}* at ${address}.\n\nWould you like to help? Please choose an option below.`,
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

            // donor may live in Users or Donors collection
            let donorRecord = await Users.findOne({ _id: donorId }, userProjection.user);
            if (!donorRecord) {
                donorRecord = await Donors.findById(donorId);
            }

            // Null check for donorRecord and requester
            if (!donorRecord || !requester) {
                return this.res.send({ status: 0, message: "User not found" });
            }

            const donorName = donorRecord.userName || donorRecord.UserName || donorRecord.name || 'Unknown';
            const bloodGroup = donorRecord.bloodGroup || 'Unknown';
            const phone = donorRecord.phoneNumber || donorRecord.phone || 'N/A';

            const message = `
                🩸 New Donor Available 🩸
                A new donor has shown interest in helping.
                👤 Name: ${donorName}
                🩸 Blood Group: ${bloodGroup}
                📞 Contact: ${phone}
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

            // perform lookup against both users and manual donors collections
            let requests = await Requests.aggregate([
                { $match: { $and: query } },
                {
                    $lookup: {
                        from: "users",
                        localField: "donorId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "donors",
                        localField: "donorId",
                        foreignField: "_id",
                        as: "donorDetails"
                    }
                },
                {
                    $addFields: {
                        merged: {
                            $cond: [
                                { $gt: [{ $size: "$userDetails" }, 0] },
                                { $arrayElemAt: ["$userDetails", 0] },
                                { $arrayElemAt: ["$donorDetails", 0] }
                            ]
                        }
                    }
                },
                { "$unwind": "$merged" },
                {
                    $project: {
                        requestId: "$requestId",
                        userId: "$merged._id",
                        userName: { $ifNull: ["$merged.userName", "$merged.name"] },
                        phoneNumber: { $ifNull: ["$merged.phoneNumber", "$merged.phone"] },
                        pincode: "$merged.pincode",
                        bloodGroup: { $ifNull: ["$merged.bloodGroup", "$merged.bloodGroup"] }
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

    /********************************************************
     Purpose: get donors for a single request
     Parameter: params.id (requestId)
     Return: JSON String
    ********************************************************/
    async getDonorsForRequest() {
        try {
            const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
            const { id } = this.req.params; // requestId

            if (!id) {
                return this.res.send({ status: 0, message: "Request ID missing" });
            }

            // aggregate donors linked to the given request belonging to current user
            let donors = await Requests.aggregate([
                { $match: { requestId: id, requestedBy: new ObjectId(currentUser) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "donorId",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "donors",
                        localField: "donorId",
                        foreignField: "_id",
                        as: "donorDetails"
                    }
                },
                {
                    $addFields: {
                        merged: {
                            $cond: [
                                { $gt: [{ $size: "$userDetails" }, 0] },
                                { $arrayElemAt: ["$userDetails", 0] },
                                { $arrayElemAt: ["$donorDetails", 0] }
                            ]
                        }
                    }
                },
                { $unwind: "$merged" },
                {
                    $project: {
                        userId: "$merged._id",
                        userName: { $ifNull: ["$merged.userName", "$merged.name"] },
                        phoneNumber: { $ifNull: ["$merged.phoneNumber", "$merged.phone"] },
                        bloodGroup: "$merged.bloodGroup",
                        status: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$isAcceptedByUser", true] }, then: "accepted" },
                                    { case: { $eq: ["$isRejectedByUser", true] }, then: "rejected" }
                                ],
                                default: "pending"
                            }
                        }
                    }
                }
            ]);

            return _.isEmpty(donors)
                ? this.res.send({ status: 0, message: "No donors found for this request" })
                : this.res.send({ status: 1, data: donors });

        } catch (error) {
            console.log("error = ", error);
            this.res.send({ status: 0, message: error.message || 'An error occurred while fetching request donors' });
        }
    }
}
module.exports = RequestsController;