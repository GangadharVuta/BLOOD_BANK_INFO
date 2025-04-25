var mongoose = require('mongoose');
var schema = mongoose.Schema;
const _ = require("lodash");

var request = new schema({
    requestedBy: { type: schema.Types.ObjectId, ref: 'Users' },
    donorId: { type: schema.Types.ObjectId, ref: 'Users' },
    pincode: { type: String },
    bloodGroup: { type: String },
    address: { type: String },
    requestId: { type: String },
    isAcceptedByUser: { type: Boolean, default: false },
    isRejectedByUser: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});


let Requests = mongoose.model('requests', request);
module.exports = {
    Requests,
    request
}