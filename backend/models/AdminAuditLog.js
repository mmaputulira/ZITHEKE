import mongoose from "mongoose";

const schema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null, index: true },
  adminEmail: { type: String, default: "", index: true },
  adminRole: { type: String, default: "admin", index: true },
  action: { type: String, required: true, index: true },
  method: { type: String, default: "" },
  path: { type: String, default: "" },
  targetType: { type: String, default: "" },
  targetId: { type: String, default: "" },
  reason: { type: String, default: "", maxlength: 1000 },
  statusCode: { type: Number, default: 200 },
  ip: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

schema.index({ createdAt: -1 });
export default mongoose.model("AdminAuditLog", schema);
