import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    adId: { type: mongoose.Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    buyerUid: { type: String, required: true, index: true },
    sellerUid: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    counterAmount: { type: Number, default: null, min: 0 },
    agreedAmount: { type: Number, default: null, min: 0 },
    isOpen: { type: Boolean, default: true },
    currency: { type: String, default: "MWK" },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["PENDING", "COUNTERED", "ACCEPTED", "DECLINED", "WITHDRAWN"],
      default: "PENDING",
      index: true,
    },
    lastActionBy: { type: String, enum: ["buyer", "seller"], default: "buyer" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

offerSchema.index({ adId: 1, buyerUid: 1, status: 1, createdAt: -1 });
offerSchema.index({ sellerUid: 1, status: 1, createdAt: -1 });
offerSchema.index({ adId: 1, buyerUid: 1 }, { unique: true, partialFilterExpression: { isOpen: true }, name: "uniq_open_buyer_offer" });

export default mongoose.models.Offer || mongoose.model("Offer", offerSchema);
