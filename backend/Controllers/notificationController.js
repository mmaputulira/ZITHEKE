import { accountTypeOf } from "../utils/marketplacePolicy.js";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import AdminNotification from "../models/AdminNotification.js";

export const listMyNotifications = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user?.uid }).select("_id uid accountType").lean();
    if (!user) return res.status(404).json({ success:false, message:"User not found" });
    const isSeller = accountTypeOf(user) === "merchant";
    const now = new Date();
    // Everyone buys; sellers also get seller announcements.
    const audience = isSeller ? ["all", "sellers", "buyers"] : ["all", "buyers"];
    const items = await AdminNotification.find({
      isActive:true,
      $and:[
        { $or:[{expiresAt:null},{expiresAt:{$gt:now}}] },
        { $or:[{audience:{$in:audience}},{audience:"user",targetUserId:user._id}] },
      ],
    }).sort({createdAt:-1}).limit(100).lean();
    return res.json({ success:true, data:items });
  } catch (error) {
    return res.status(500).json({ success:false, message:error?.message || "Failed to load notifications" });
  }
};
