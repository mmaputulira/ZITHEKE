import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderReference: { type: String, required: true, unique: true, index: true },
    openKey: { type: String, unique: true, sparse: true },
    adId: { type: mongoose.Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    buyerUid: { type: String, required: true, index: true },
    buyerName: { type: String, default: "", trim: true },
    sellerUid: { type: String, required: true, index: true },
    sellerName: { type: String, default: "", trim: true },
    titleSnapshot: { type: String, required: true, trim: true },
    imageSnapshot: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "MWK" },
    source: { type: String, enum: ["listing_price", "accepted_offer"], default: "listing_price" },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", default: null },
    paymentArrangement: {
      type: String,
      enum: ["direct_with_seller"],
      default: "direct_with_seller",
    },
    status: {
      type: String,
      enum: ["PENDING_SELLER", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"],
      default: "PENDING_SELLER",
      index: true,
    },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    sellerNote: { type: String, default: "", trim: true, maxlength: 500 },
    buyerNote: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ buyerUid: 1, status: 1, createdAt: -1 });
orderSchema.index({ sellerUid: 1, status: 1, createdAt: -1 });
orderSchema.index({ adId: 1, buyerUid: 1, status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
