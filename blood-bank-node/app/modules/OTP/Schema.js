/**************************
 OTP SCHEMA INITIALISATION
 **************************/
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const otpSchema = new schema({
    phoneNumber: { 
        type: String,
        match: /^\d{10}$/ // 10-digit mobile number
    },
    emailId: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email validation
    },
    otp: { 
        type: String, 
        required: true 
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    attempts: { 
        type: Number, 
        default: 0,
        max: 5  // Max 5 attempts before expiry
    },
    otpType: { 
        type: String, 
        enum: ['registration', 'password_reset'],
        default: 'registration'
    },
    expiresAt: { 
        type: Date, 
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        index: { expireAfterSeconds: 600 } // Auto-delete after 10 minutes
    }
}, {
    timestamps: true
});

// Compound index for unique mobile + active OTP
otpSchema.index({ phoneNumber: 1, verified: 1 });
otpSchema.index({ emailId: 1, otpType: 1 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = {
    OTP,
    otpSchema
};

