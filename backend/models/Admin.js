import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    roles: { type: [String], enum: ["super_admin","marketplace","finance","payment_verification","moderator","risk","support","content","reporting","technical"], default: undefined },
    active: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["super_admin","marketplace","finance","payment_verification","moderator","risk","support","content","reporting","technical","admin"],
      default: "support",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
