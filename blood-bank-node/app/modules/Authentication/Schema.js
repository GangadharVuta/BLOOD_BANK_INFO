/**************************
 AUTHENTICATION SCHEMA INITIALISATION
 **************************/
var Schema = require('mongoose').Schema;
var mongoose = require('mongoose');

var authtokensSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'Users' },
    token: { type: String, required: true },
    deviceId: { type: String },
    role: { type: String },
    ipAddress: { type: String },
    tokenExpiryTime: { type: Date }
},
    { timestamps: true });

var Authtokens = mongoose.model('authtokens', authtokensSchema);

module.exports = {
    Authtokens: Authtokens,
}

