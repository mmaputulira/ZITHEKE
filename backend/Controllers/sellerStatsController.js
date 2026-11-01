import Ad from "../models/Ad.js";
import User from "../models/User.js";

/* =====================================================
   📊 GET SELLER STATS (PUBLIC)
   🌍 NO LOGIN REQUIRED
   GET /api/sellers/:sellerId/stats
===================================================== */
export const getSellerStats = async (req, res) => {
  try {
    const { sellerId } = req.params;

    /* ===============================
       🧪 BASIC VALIDATION
    =============================== */
    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    /* ===============================
       📦 STATS CALCULATION
    =============================== */
    const [totalAds, approvedAds, seller, firstAd] = await Promise.all([
      Ad.countDocuments({ ownerUid: sellerId }),
      Ad.countDocuments({ ownerUid: sellerId, status: "Approved" }),
      User.findOne({ uid: sellerId })
        .select("merchantVerified status accountType merchantStatus createdAt")
        .lean(),
      Ad.findOne({ ownerUid: sellerId })
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean(),
    ]);

    if (!seller || seller.accountType === "buyer" || seller.status !== "Active" || (seller.merchantStatus || "active") !== "active") {
      return res.status(404).json({ message: "Seller not found" });
    }

    return res.status(200).json({
      joinedAt: seller.createdAt || firstAd?.createdAt || null,
      totalAds,
      approvedAds,
      isVerifiedSeller: Boolean(seller.merchantVerified),
      isEstablishedSeller: approvedAds >= 3,
    });
  } catch (error) {
    console.error("❌ Seller stats error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
