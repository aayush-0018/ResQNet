import mongoose from "mongoose";

const ContributorSchema = new mongoose.Schema({
  contributorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DepartmentUser', 
    required: true 
  },
  ndrfTeamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DepartmentUser', 
    required: true 
  },
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  notifications: {
    type: [{
    emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
    // store as strings to avoid casting errors when client sends string ids
    emergencyIds: [{ type: String }],
    // store full emergency objects without strict typing to avoid cast issues
    emergencyArray: { type: [mongoose.Schema.Types.Mixed], default: [] },
    message: String,
    sentAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
    }],
    default: []
  },
  // Ensure notifications array exists to avoid validation errors when pushing
}, { minimize: false });

// Index for efficient queries
ContributorSchema.index({ contributorId: 1, ndrfTeamId: 1 }, { unique: true });
ContributorSchema.index({ ndrfTeamId: 1 });

export default mongoose.model("Contributor", ContributorSchema);