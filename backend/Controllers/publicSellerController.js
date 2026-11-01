import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import SellerFollow from "../models/SellerFollow.js";
import { assertMerchantUid } from "../Services/marketplaceIdentity.service.js";
import { eligibleMerchantQuery } from "../Services/publicMerchants.service.js";
import Ad from "../models/Ad.js";

/* =====================================================
   🌍 GET SELLER ADS (PUBLIC)
   GET /api/public/sellers/:sellerId/ads
   - Anyone can view
   - No auth required
===================================================== */
export const getPublicSellerAds = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID required" });
    }

    await assertMerchantUid(sellerId);
    const ads = await Ad.find({
      ownerUid: sellerId,
      status: "Approved", // ✅ ONLY approved ads
    }).sort({ createdAt: -1 });

    return res.status(200).json(ads);
  } catch (error) {
    console.error("❌ Public seller ads error:", error);
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Server error" });
  }
};

export const getSellerDirectory = async (req,res) => {
  const q = String(req.query.q || "").trim().slice(0,100);
  const query = { ...eligibleMerchantQuery };
  if(q) { const safe = [...q].map(c => ".*+?^${}()|[]\\".includes(c) ? "\\" + c : c).join(""); query.$and = [...query.$and, { $or:[{name:{$regex:safe,$options:"i"}},{city:{$regex:safe,$options:"i"}},{location:{$regex:safe,$options:"i"}}] }]; }
  const users = await User.find(query).select("_id uid name photoURL city location merchantVerified").lean();
  const uids = users.map(u=>u.uid), ids = users.map(u=>u._id);
  const [counts, follows, subscriptions] = await Promise.all([
    Ad.aggregate([{ $match:{ownerUid:{$in:uids},status:"Approved"} },{$group:{_id:"$ownerUid",count:{$sum:1}}}]),
    SellerFollow.aggregate([{ $match:{sellerUid:{$in:uids}} },{$group:{_id:"$sellerUid",count:{$sum:1}}}]),
    Subscription.find({userId:{$in:ids},scope:"seller_membership",status:"active",endDate:{$gt:new Date()}}).populate("planId").lean(),
  ]);
  const ads = new Map(counts.map(c=>[c._id,c.count])), followers = new Map(follows.map(c=>[c._id,c.count]));
  const plans = new Map(subscriptions.map(s=>[String(s.userId),s]));
  const sellers = users.map(u=>{ const sub=plans.get(String(u._id)); return { uid:u.uid,name:u.name,photoURL:u.photoURL,city:u.city,location:u.location,verified:Boolean(u.merchantVerified),totalAds:ads.get(u.uid)||0,followers:followers.get(u.uid)||0,profileBoost:sub?.planId?.isActive ? { active:true,planName:sub.planId.name,priority:sub.planId.priorityLevel||0,endDate:sub.endDate } : {active:false} }; })
    .filter(s=>s.totalAds>0).sort((a,b)=>Number(b.profileBoost.active)-Number(a.profileBoost.active)||(b.profileBoost.priority||0)-(a.profileBoost.priority||0)||Number(b.verified)-Number(a.verified)||b.totalAds-a.totalAds);
  res.json({sellers:sellers.slice(0,Math.min(100,Math.max(1,Number(req.query.limit)||60)))});
};
