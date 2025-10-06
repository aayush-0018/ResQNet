import mongoose from "mongoose";
import { err, log } from "../utils/logger.js";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set in environment (.env)");

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      // use recommended defaults for mongoose v7+
    });
    log("🗄️  MongoDB connected");
  } catch (e) {
    err("MongoDB connection error:", e);
    throw e;
  }
};
