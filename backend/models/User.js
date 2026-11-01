// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: {
      type: String,
      required: function () {
        return this.authProvider === "password";
      },
      default: null,
    },

    passwordHash: { type: String, default: "" },
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
    authProviders: {
      type: [String],
      enum: ["password", "google"],
      default: [],
    },

    photoURL: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    location: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Review", "Suspended"],
      default: "Active",
    },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    accountType: { type: String, enum: ["merchant", "buyer"], default: "merchant", index: true },
    merchantStatus: { type: String, enum: ["active", "pending", "rejected", "suspended"], default: "active", index: true },
    merchantVerified: { type: Boolean, default: false },
    merchantApplication: {
      businessName: { type: String, default: "", maxlength: 160 },
      note: { type: String, default: "", maxlength: 1000 },
      requestedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      reason: { type: String, default: "", maxlength: 500 },
    },
    adsPosted: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ad",
      },
    ],
  },
  { timestamps: true }
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" } },
  }
);

const User = mongoose.model("User", userSchema);
export default User;
