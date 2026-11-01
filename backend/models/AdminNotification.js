import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  audience: { type: String, enum: ["all", "sellers", "buyers", "user"], default: "all", index: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  severity: { type: String, enum: ["info", "success", "warning", "urgent"], default: "info", index: true },
  isActive: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
}, { timestamps: true });

schema.index({ createdAt: -1 });
export default mongoose.model("AdminNotification", schema);
