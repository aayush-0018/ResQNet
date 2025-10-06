import mongoose from "mongoose";

const EmergencySchema = new mongoose.Schema({
  type: { type: String, required: true },           // flood, fire, accident...
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  reporterId: { type: String }, 
  email: { type: String },
  mobileNumber: { 
    type: String, 
    required: true, 
    match: /^[6-9]\d{9}$/ // validates 10-digit Indian mobile numbers
  },                    // optional link to user
  meta: { type: Object },                           // additional payload
  address: { type: String },                        // human-readable address from reverse geocoding
  // Enhanced address fields for better geocoding
  addressDetails: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" }
  },
  status: { type: String, default: "open" },        // open, assigned, resolved
  createdAt: { type: Date, default: Date.now }
});

// 2dsphere index for geo queries
EmergencySchema.index({ location: "2dsphere" });

export default mongoose.model("Emergency", EmergencySchema);
