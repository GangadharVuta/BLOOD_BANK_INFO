var mongoose = require('mongoose');
var schema = mongoose.Schema;

var donor = new schema({
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    lastDonationDate: { type: Date, required: true },
    addedBy: { type: schema.Types.ObjectId, ref: 'Users', required: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

let Donors = mongoose.model('donors', donor);
module.exports = {
    Donors,
    donor
}
