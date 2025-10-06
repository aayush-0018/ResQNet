import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DepartmentUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  state: { type: String, required: true },
  role: { type: String, enum: ["NDRF", "CONTRIBUTOR"], required: true },
  createdAt: { type: Date, default: Date.now }
});

// helper for setting password
DepartmentUserSchema.methods.setPassword = async function (pwd) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(pwd, salt);
};

DepartmentUserSchema.methods.validatePassword = async function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

export default mongoose.model("DepartmentUser", DepartmentUserSchema);
