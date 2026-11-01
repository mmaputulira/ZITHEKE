import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema(
  {
    userUid: { type: String, required: true, index: true },
    adId: { type: mongoose.Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    baselinePrice: { type: Number, required: true, min: 0 },
    targetPrice: { type: Number, default: null, min: 0 },
    lastNotifiedPrice: { type: Number, default: null, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

priceAlertSchema.index({ userUid: 1, adId: 1 }, { unique: true });

export default mongoose.models.PriceAlert || mongoose.model("PriceAlert", priceAlertSchema);
