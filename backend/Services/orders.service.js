import crypto from "crypto";
import mongoose from "mongoose";
import Ad from "../models/Ad.js";
import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import { isPurchasable, normalizeCurrency, policyError } from "../utils/marketplacePolicy.js";
import { assertMerchantUid } from "./marketplaceIdentity.service.js";
import { expireActiveAdBoostForSale } from "./payments/subscriptionExpiry.service.js";

export const createPurchaseRequest = async ({ buyer, adId, offerId, note = "" }) => {
  if (!mongoose.Types.ObjectId.isValid(adId)) throw policyError(400, "Invalid listing ID.");
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const ad = await Ad.findById(adId).session(session);
      if (!isPurchasable(ad) || ad.reservedOrderId) throw policyError(409, "This listing is not available for purchase.");
      if (ad.ownerUid === buyer.uid) throw policyError(409, "You cannot purchase your own listing.");
      const merchant = await assertMerchantUid(ad.ownerUid, session);
      const openKey = `${ad._id}:${buyer.uid}`;
      const existing = await Order.findOne({ openKey }).session(session);
      if (existing) { result = { order: existing, reused: true }; return; }
      const query = { adId: ad._id, buyerUid: buyer.uid, sellerUid: ad.ownerUid, status: "ACCEPTED" };
      if (offerId) {
        if (!mongoose.Types.ObjectId.isValid(offerId)) throw policyError(400, "Invalid offer ID.");
        query._id = offerId;
      }
      const offer = await Offer.findOne(query).sort({ respondedAt: -1, updatedAt: -1 }).session(session);
      if (offerId && !offer) throw policyError(409, "This accepted offer is unavailable.");
      const amount = offer ? Number(offer.agreedAmount ?? offer.amount) : Number(ad.price);
      if (!Number.isFinite(amount) || amount <= 0) throw policyError(409, "Invalid agreed purchase price.");
      if (offer && normalizeCurrency(offer.currency) !== normalizeCurrency(ad.currency)) throw policyError(409, "Offer currency does not match the listing.");
      const [order] = await Order.create([{
        orderReference: `ZTH-ORD-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        adId: ad._id, buyerUid: buyer.uid, buyerName: buyer.name || "Buyer", sellerUid: ad.ownerUid, sellerName: merchant.name,
        titleSnapshot: ad.title, imageSnapshot: ad.images?.[0] || "", amount, currency: normalizeCurrency(ad.currency),
        source: offer ? "accepted_offer" : "listing_price", offerId: offer?._id || null, openKey,
        buyerNote: String(note).trim().slice(0,500),
      }], { session });
      result = { order, reused: false };
    });
    return result;
  } catch (error) {
    if (error.code === 11000) {
      const order = await Order.findOne({ openKey: `${adId}:${buyer.uid}` });
      if (order) return { order, reused: true };
    }
    throw error;
  } finally { await session.endSession(); }
};

export const transitionOrder = async ({ principal, orderId, action, note = "" }) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw policyError(400, "Invalid order ID.");
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw policyError(404, "Order not found.");
      const buyer = order.buyerUid === principal.uid && principal.status === "Active";
      const seller = principal.accountType === "merchant" && order.sellerUid === principal.uid && principal.status === "Active" && principal.merchantStatus === "active";
      if (!buyer && !seller) throw policyError(403, "You cannot manage this order.");
      const now = new Date();
      const cleanNote = String(note).trim().slice(0,500);
      if (action === "accept" && seller && order.status === "PENDING_SELLER") {
        await assertMerchantUid(principal.uid, session);
        const ad = await Ad.findOneAndUpdate({ _id: order.adId, ownerUid: principal.uid, status: "Approved", reservedOrderId: null }, { $set: { reservedOrderId: order._id } }, { new: true, session });
        if (!ad || !isPurchasable(ad)) throw policyError(409, "This listing is no longer available.");
        order.status = "ACCEPTED"; order.acceptedAt = now; order.sellerNote = cleanNote;
        await Order.updateMany({ _id: { $ne: order._id }, adId: order.adId, status: "PENDING_SELLER" }, { $set: { status: "DECLINED", declinedAt: now, sellerNote: "Another purchase was accepted." }, $unset: { openKey: "" } }, { session });
      } else if (action === "decline" && seller && order.status === "PENDING_SELLER") {
        order.status = "DECLINED"; order.declinedAt = now; order.sellerNote = cleanNote; order.openKey = undefined;
      } else if (action === "cancel" && buyer && ["PENDING_SELLER", "ACCEPTED"].includes(order.status)) {
        order.status = "CANCELLED"; order.cancelledAt = now; order.buyerNote = cleanNote || order.buyerNote; order.openKey = undefined;
        await Ad.updateOne({ _id: order.adId, reservedOrderId: order._id }, { $set: { reservedOrderId: null } }, { session });
      } else if (action === "complete" && seller && order.status === "ACCEPTED") {
        const ad = await Ad.findOneAndUpdate({ _id: order.adId, ownerUid: principal.uid, reservedOrderId: order._id, status: "Approved" }, { $set: { status: "Sold", reservedOrderId: null, featured: false, boostSubscriptionId: null, boostPaymentId: null, boostStartDate: null, boostEndDate: null } }, { session, new: true });
        if (!ad) throw policyError(409, "This reserved listing cannot be completed. Contact support.");
        await expireActiveAdBoostForSale({ adId: order.adId, ownerUid: principal.uid, now, session });
        await Offer.updateMany({ adId: order.adId, status: { $in: ["PENDING", "COUNTERED"] } }, { $set: { status: "DECLINED", isOpen: false, respondedAt: now } }, { session });
        order.status = "COMPLETED"; order.completedAt = now; order.sellerNote = cleanNote || order.sellerNote; order.openKey = undefined;
      } else throw policyError(409, "This order action is not available.");
      await order.save({ session }); result = order;
    });
    return result;
  } finally { await session.endSession(); }
};
