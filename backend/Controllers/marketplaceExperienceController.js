import { assertMerchantUid } from "../Services/marketplaceIdentity.service.js";
import { isActiveBuyer, isActiveMerchant, normalizeCurrency } from "../utils/marketplacePolicy.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Offer from "../models/Offer.js";
import SellerFollow from "../models/SellerFollow.js";
import PriceAlert from "../models/PriceAlert.js";
import Conversation from "../models/Conversation.js";
import Subscription from "../models/Subscription.js";
import { SUBSCRIPTION_STATUSES } from "../constants/subscriptionStatuses.js";

const bad = (res, code, message) => res.status(code).json({ message });
const uid = (req) => req.user?.uid;

export const createOffer = async (req, res) => {
  try {
    const buyerUid = uid(req);
    const { adId, amount, message = "" } = req.body;
    if (!buyerUid) return bad(res, 401, "Unauthorized");
    if (!mongoose.Types.ObjectId.isValid(adId)) return bad(res, 400, "Invalid advert");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return bad(res, 400, "Enter a valid offer amount");
    const ad = await Ad.findOne({ _id: adId, status: "Approved" }).select("_id ownerUid title price images status currency negotiable reservedOrderId");
    if (!ad) return bad(res, 404, "Advert not found");
    if (!ad.negotiable || ad.reservedOrderId) return bad(res, 409, "This listing is not available for negotiation.");
    await assertMerchantUid(ad.ownerUid);
    if (ad.ownerUid === buyerUid) return bad(res, 409, "You cannot make an offer on your own advert");
    const existing = await Offer.findOne({ adId, buyerUid, status: { $in: ["PENDING", "COUNTERED"] } });
    if (existing) return bad(res, 409, "You already have an open offer on this advert");
    const offer = await Offer.create({ adId, buyerUid, sellerUid: ad.ownerUid, amount: numericAmount, message, currency: normalizeCurrency(ad.currency) });
    const hydrated = await Offer.findById(offer._id).populate("adId", "title price images city");
    res.status(201).json(hydrated);
  } catch (error) {
    console.error("createOffer", error);
    bad(res, error.code === 11000 ? 409 : error.statusCode || 500, error.code === 11000 ? "You already have an open offer on this listing" : error.statusCode ? error.message : "Unable to create offer");
  }
};

export const listOffers = async (req, res) => {
  try {
    const userUid = uid(req);
    if (!userUid) return bad(res, 401, "Unauthorized");
    const sent = await Offer.find({ buyerUid: userUid, ...(req.user.accountType === "merchant" ? { _id:null } : {}) }).populate("adId", "title price images city ownerName").sort({ createdAt: -1 }).lean();
    const received = await Offer.find({ sellerUid: userUid, ...(req.user.accountType === "buyer" ? { _id:null } : {}) }).populate("adId", "title price images city ownerName").sort({ createdAt: -1 }).lean();
    const uids = [...new Set([...sent.flatMap((o) => [o.buyerUid, o.sellerUid]), ...received.flatMap((o) => [o.buyerUid, o.sellerUid])])];
    const people = await User.find({ uid: { $in: uids } }).select("uid name photoURL").lean();
    const peopleMap = new Map(people.map((p) => [p.uid, p]));
    const enrich = (rows) => rows.map((o) => ({ ...o, buyer: peopleMap.get(o.buyerUid) || null, seller: peopleMap.get(o.sellerUid) || null }));
    res.json({ sent: enrich(sent), received: enrich(received) });
  } catch (error) {
    console.error("listOffers", error);
    bad(res, 500, "Unable to load offers");
  }
};

export const respondToOffer = async (req, res) => {
  try {
    const userUid = uid(req);
    const { offerId } = req.params;
    const { action, counterAmount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(offerId)) return bad(res, 400, "Invalid offer");
    const offer = await Offer.findById(offerId);
    if (!offer) return bad(res, 404, "Offer not found");

    const advert = await Ad.findById(offer.adId).select("status negotiable reservedOrderId ownerUid");
    if (!advert || advert.status !== "Approved" || !advert.negotiable || advert.reservedOrderId) {
      return bad(
        res,
        409,
        "This listing is no longer available for negotiation."
      );
    }

    await assertMerchantUid(offer.sellerUid);
    const buyerAccount = await User.findOne({ uid: offer.buyerUid }).lean();
    if (!isActiveBuyer(buyerAccount)) return bad(res, 409, "This buyer is unavailable.");
    const previousStatus = offer.status;
    const previousUpdatedAt = offer.updatedAt;
    const normalized = String(action || "").toUpperCase();
    if (offer.sellerUid === userUid && isActiveMerchant(req.user)) {
      if (!['ACCEPT','DECLINE','COUNTER'].includes(normalized)) return bad(res, 400, "Invalid seller action");
      if (!["PENDING", "COUNTERED"].includes(offer.status)) return bad(res, 409, "This offer is already closed");
      if (normalized === "ACCEPT") { if (offer.status === "COUNTERED") return bad(res, 409, "Wait for the buyer to respond to your counter offer."); offer.status = "ACCEPTED"; offer.agreedAmount = offer.amount; }
      if (normalized === "DECLINE") offer.status = "DECLINED";
      if (normalized === "COUNTER") {
        const counter = Number(counterAmount);
        if (!Number.isFinite(counter) || counter <= 0) return bad(res, 400, "Enter a valid counter offer");
        offer.counterAmount = counter;
        offer.status = "COUNTERED";
      }
      offer.lastActionBy = "seller";
      offer.respondedAt = new Date();
    } else if (offer.buyerUid === userUid && isActiveBuyer(req.user)) {
      if (!['ACCEPT_COUNTER','WITHDRAW'].includes(normalized)) return bad(res, 400, "Invalid buyer action");
      if (normalized === "ACCEPT_COUNTER") {
        if (offer.status !== "COUNTERED" || !offer.counterAmount) return bad(res, 409, "There is no counter offer to accept");
        offer.amount = offer.counterAmount;
        offer.agreedAmount = offer.counterAmount;
        offer.status = "ACCEPTED";
      } else {
        if (!["PENDING", "COUNTERED"].includes(offer.status)) return bad(res, 409, "This offer is already closed");
        offer.status = "WITHDRAWN";
      }
      offer.lastActionBy = "buyer";
      offer.respondedAt = new Date();
    } else return bad(res, 403, "You are not part of this offer");
    const updated = await Offer.findOneAndUpdate({ _id:offer._id, status:previousStatus, updatedAt:previousUpdatedAt }, { $set: { status:offer.status, amount:offer.amount, agreedAmount:offer.agreedAmount, counterAmount:offer.counterAmount, lastActionBy:offer.lastActionBy, respondedAt:offer.respondedAt, isOpen:["PENDING", "COUNTERED"].includes(offer.status) } }, { new:true }).populate("adId", "title price images city");
    if (!updated) return bad(res, 409, "This offer changed. Refresh and try again.");
    res.json(updated);
  } catch (error) {
    console.error("respondToOffer", error);
    bad(res, error.statusCode || 500, error.statusCode ? error.message : "Unable to update offer");
  }
};

export const toggleFollow = async (req, res) => {
  try {
    const followerUid = uid(req);
    const { sellerUid } = req.body;
    if (!sellerUid) return bad(res, 400, "Seller is required");
    if (sellerUid === followerUid) return bad(res, 409, "You cannot follow yourself");

    const seller = await User.findOne({
      uid: sellerUid,
      status: { $nin: ["Suspended", "Inactive"] },
    }).select("uid");
    if (!seller) return bad(res, 404, "Seller not found");
    await assertMerchantUid(sellerUid);

    const existing = await SellerFollow.findOne({ followerUid, sellerUid });
    if (existing) {
      await existing.deleteOne();
      const count = await SellerFollow.countDocuments({ sellerUid });
      return res.json({ following: false, followers: count });
    }
    await SellerFollow.create({ followerUid, sellerUid });
    const count = await SellerFollow.countDocuments({ sellerUid });
    res.json({ following: true, followers: count });
  } catch (error) {
    if (error?.code === 11000) return res.json({ following: true });
    console.error("toggleFollow", error);
    bad(res, 500, "Unable to update follow");
  }
};

export const followStatus = async (req, res) => {
  try {
    const userUid = uid(req);
    const { sellerUid } = req.params;
    const [following, followers] = await Promise.all([
      SellerFollow.exists({ followerUid: userUid, sellerUid }),
      SellerFollow.countDocuments({ sellerUid }),
    ]);
    res.json({ following: Boolean(following), followers });
  } catch (error) { bad(res, 500, "Unable to load follow status"); }
};

export const followedSellers = async (req, res) => {
  try {
    const rows = await SellerFollow.find({ followerUid: uid(req) }).sort({ createdAt: -1 }).lean();
    const sellerUids = rows.map((r) => r.sellerUid);
    const ads = await Ad.aggregate([
      { $match: { ownerUid: { $in: sellerUids }, status: "Approved" } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$ownerUid", name: { $first: "$ownerName" }, city: { $first: "$city" }, image: { $first: "$ownerImage" }, latestAd: { $first: "$$ROOT" }, totalAds: { $sum: 1 } } },
    ]);
    const byUid = new Map(ads.map((a) => [a._id, a]));
    res.json(rows.map((r) => ({ sellerUid: r.sellerUid, followedAt: r.createdAt, ...(byUid.get(r.sellerUid) || { name: "Seller", totalAds: 0 }) })));
  } catch (error) { bad(res, 500, "Unable to load followed sellers"); }
};

export const togglePriceAlert = async (req, res) => {
  try {
    const userUid = uid(req);
    const { adId, targetPrice = null } = req.body;
    if (!mongoose.Types.ObjectId.isValid(adId)) return bad(res, 400, "Invalid advert");
    const ad = await Ad.findById(adId).select("price status ownerUid");
    if (!ad || ad.status !== "Approved") return bad(res, 404, "Advert not found");
    if (ad.ownerUid === userUid) return bad(res, 409, "Price alerts are for buyer listings");
    const existing = await PriceAlert.findOne({ userUid, adId });
    if (existing?.active) {
      existing.active = false; await existing.save();
      return res.json({ active: false });
    }
    const alert = existing || new PriceAlert({ userUid, adId, baselinePrice: Number(ad.price || 0) });
    alert.active = true; alert.baselinePrice = Number(ad.price || 0);
    alert.targetPrice = targetPrice === null || targetPrice === "" ? null : Number(targetPrice);
    await alert.save();
    res.json({ active: true, alert });
  } catch (error) { console.error("togglePriceAlert", error); bad(res, 500, "Unable to update price alert"); }
};

export const listPriceAlerts = async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userUid: uid(req), active: true }).populate("adId", "title price images city status ownerName").sort({ updatedAt: -1 }).lean();
    const enriched = alerts.filter((a) => a.adId).map((a) => ({ ...a, currentPrice: Number(a.adId.price || 0), priceDrop: Number(a.adId.price || 0) < Number(a.baselinePrice || 0), dropAmount: Math.max(0, Number(a.baselinePrice || 0) - Number(a.adId.price || 0)), targetReached: a.targetPrice != null && Number(a.adId.price || 0) <= Number(a.targetPrice) }));
    res.json(enriched);
  } catch (error) { bad(res, 500, "Unable to load price alerts"); }
};

export const sellerAnalytics = async (req, res) => {
  try {
    const sellerUid = uid(req);
    const ads = await Ad.find({ ownerUid: sellerUid })
      .select(
        "title views favouritesCount featured boostStartDate boostEndDate createdAt status images price"
      )
      .sort({ createdAt: -1 })
      .lean();

    const adIds = ads.map((ad) => ad._id);
    const [conversationCounts, offerCounts, followers, activeBoosts] =
      await Promise.all([
        Conversation.aggregate([
          { $match: { adId: { $in: adIds } } },
          { $group: { _id: "$adId", count: { $sum: 1 } } },
        ]),
        Offer.aggregate([
          { $match: { adId: { $in: adIds }, sellerUid } },
          { $group: { _id: "$adId", count: { $sum: 1 } } },
        ]),
        SellerFollow.countDocuments({ sellerUid }),
        Subscription.find({
          adId: { $in: adIds },
          status: SUBSCRIPTION_STATUSES.ACTIVE,
          scope: "ad_boost",
        })
          .populate("planId", "name slug durationDays price")
          .populate(
            "adId",
            "title views favouritesCount images boostStartDate boostEndDate"
          )
          .lean(),
      ]);

    const inquiryMap = new Map(
      conversationCounts.map((row) => [String(row._id), row.count || 0])
    );
    const offerMap = new Map(
      offerCounts.map((row) => [String(row._id), row.count || 0])
    );

    const totals = ads.reduce(
      (acc, ad) => ({
        views: acc.views + Number(ad.views || 0),
        saves: acc.saves + Number(ad.favouritesCount || 0),
      }),
      { views: 0, saves: 0 }
    );

    const perAd = ads.map((ad) => ({
      ...ad,
      inquiries: inquiryMap.get(String(ad._id)) || 0,
      offers: offerMap.get(String(ad._id)) || 0,
    }));

    const boosts = activeBoosts.map((subscription) => ({
      _id: subscription._id,
      plan: subscription.planId,
      ad: subscription.adId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining: subscription.endDate
        ? Math.max(
            0,
            Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000)
          )
        : null,
      viewsSinceStart:
        subscription.performanceSnapshot?.viewsAtStart == null
          ? null
          : Math.max(
              0,
              Number(subscription.adId?.views || 0) -
                Number(subscription.performanceSnapshot.viewsAtStart || 0)
            ),
      savesSinceStart:
        subscription.performanceSnapshot?.savesAtStart == null
          ? null
          : Math.max(
              0,
              Number(subscription.adId?.favouritesCount || 0) -
                Number(subscription.performanceSnapshot.savesAtStart || 0)
            ),
    }));

    res.json({
      totals: {
        ads: ads.length,
        activeAds: ads.filter((ad) => ad.status === "Approved").length,
        views: totals.views,
        saves: totals.saves,
        inquiries: conversationCounts.reduce(
          (sum, row) => sum + Number(row.count || 0),
          0
        ),
        offers: offerCounts.reduce(
          (sum, row) => sum + Number(row.count || 0),
          0
        ),
        followers,
        activeBoosts: boosts.length,
      },
      ads: perAd,
      boosts,
    });
  } catch (error) {
    console.error("sellerAnalytics", error);
    bad(res, 500, "Unable to load seller analytics");
  }
};


export const marketplaceSummary = async (req, res) => {
  try {
    const userUid = uid(req);
    const user = await User.findOne({ uid: userUid }).select("favorites name accountType").lean();
    const [sentOffers, receivedOffers, followed, alerts, analytics] = await Promise.all([
      Offer.countDocuments({ buyerUid: userUid, status: { $in: ["PENDING", "COUNTERED"] } }),
      Offer.countDocuments({ sellerUid: userUid, status: { $in: ["PENDING", "COUNTERED"] } }),
      SellerFollow.countDocuments({ followerUid: userUid }),
      PriceAlert.countDocuments({ userUid, active: true }),
      Ad.find({ ownerUid: userUid, ...(req.user.accountType === "buyer" ? {_id:null} : {}) }).select("views favouritesCount featured boostEndDate status").lean(),
    ]);
    const seller = analytics.reduce((a, ad) => ({ views: a.views + Number(ad.views || 0), saves: a.saves + Number(ad.favouritesCount || 0), activeAds: a.activeAds + (ad.status === "Approved" ? 1 : 0), activeBoosts: a.activeBoosts + (ad.featured && (!ad.boostEndDate || new Date(ad.boostEndDate) > new Date()) ? 1 : 0) }), { views: 0, saves: 0, activeAds: 0, activeBoosts: 0 });
    res.json({ savedItems: user?.favorites?.length || 0, openOffersSent: sentOffers, openOffersReceived: receivedOffers, followedSellers: followed, priceAlerts: alerts, seller });
  } catch (error) { bad(res, 500, "Unable to load marketplace summary"); }
};
