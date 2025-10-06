import mongoose from "mongoose";

const normalTaskSchema = new mongoose.Schema(
  {
    taskType: { type: String, required: true },
    reporterId: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    meta: Object,
    status: { type: String, default: "open", enum: ["open", "assigned", "resolved"] }
  },
  { timestamps: true }
);

export default mongoose.model("NormalTask", normalTaskSchema);
