import mongoose from "mongoose";

const sellerFollowSchema = new mongoose.Schema(
  {
    followerUid: { type: String, required: true, index: true },
    sellerUid: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

sellerFollowSchema.index({ followerUid: 1, sellerUid: 1 }, { unique: true });

export default mongoose.models.SellerFollow || mongoose.model("SellerFollow", sellerFollowSchema);
