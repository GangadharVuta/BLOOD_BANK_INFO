var mongoose = require('mongoose');
var schema = mongoose.Schema;

/**
 * ============================================
 * DONOR SCHEMA
 * ============================================
 * Stores donor information for blood donation tracking
 * Privacy-focused: Personal details (name, phone) not shown in donor cards
 */
var donor = new schema({
    // User reference
    userId: { 
        type: schema.Types.ObjectId, 
        ref: 'Users'
    },

    // Basic Information
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    phone: { type: String, required: true },

    // Location Information (Updated from pincode)
    city: { type: String, required: true },
    village: { type: String, required: true },
    pincode: { type: String }, // Optional: kept for backward compatibility

    // Donation Information
    lastDonationDate: { type: Date, required: true },
    availability: { 
        type: String, 
        enum: ['Available', 'Not Available', 'Pending'],
        default: 'Available'
    },

    // Metadata
    addedBy: { type: schema.Types.ObjectId, ref: 'Users', required: true },
    donorType: { 
        type: String, 
        enum: ['registered', 'manual'],
        default: 'manual'
    },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Index for efficient querying
donor.index({ bloodGroup: 1, city: 1, village: 1 });
donor.index({ addedBy: 1 });

let Donors = mongoose.model('donors', donor);
module.exports = {
    Donors,
    donor
}
