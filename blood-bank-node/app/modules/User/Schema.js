var mongoose = require('mongoose');
var schema = mongoose.Schema;
const _ = require("lodash");

var user = new schema({
    userName: { type: String },
    phoneNumber: { type: String },
    pincode: { type: String },
    emailId: { type: String },
    role: {
        type: String,
        enum: ['Donor', 'Recipient'], // Enum values
        default: 'Donor'
    },
    bloodGroup: { type: String },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    password: { type: Buffer }
}, {
    timestamps: true
});


let Users = mongoose.model('User', user);
module.exports = {
    Users,
    user
}