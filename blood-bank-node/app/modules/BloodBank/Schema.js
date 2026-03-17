const mongoose = require('mongoose');

const BloodBankSchema = new mongoose.Schema({
  overpassId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['Blood Bank', 'Hospital'],
    default: 'Blood Bank'
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  address: String,
  phone: String,
  website: String,
  openingHours: String,
  city: String,
  pincode: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  availability: {
    status: {
      type: String,
      enum: ['Available', 'Low Stock', 'Critical'],
      default: 'Available'
    },
    updatedAt: Date
  }
}, { timestamps: true });

// Index for geospatial queries
BloodBankSchema.index({ latitude: 1, longitude: 1 });
BloodBankSchema.index({ city: 1 });

module.exports = mongoose.model('BloodBank', BloodBankSchema);
