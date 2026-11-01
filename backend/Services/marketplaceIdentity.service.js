import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import Ad from "../models/Ad.js";
import { env } from "../config/env.js";
import { publicAccount, assertAccountAvailable, isActiveBuyer, isActiveMerchant, policyError } from "../utils/marketplacePolicy.js";

export const resolvePrincipal = async (token) => {
  let decoded;
  try { decoded = jwt.verify(token, env.JWT_SECRET); } catch { throw policyError(401, "Invalid or expired token."); }
  if (!decoded.uid || !decoded.sid) throw policyError(401, "Invalid session.");
  if (!await Session.exists({ _id: decoded.sid, userUid: decoded.uid, revokedAt: null })) throw policyError(401, "Session revoked.");
  const user = await User.findOne({ uid: decoded.uid }).lean();
  assertAccountAvailable(user);
  return { ...publicAccount(user), id: user._id, sid: decoded.sid };
};
export const assertMerchantUid = async (uid, session = null) => {
  const query = User.findOne({ uid }).lean();
  if (session) query.session(session);
  const merchant = await query;
  if (!isActiveMerchant(merchant)) throw policyError(409, "This merchant is not available for marketplace transactions.");
  return merchant;
};
// REST and Socket.IO use the same participant policy. Sold listing chats can continue.
export const validateEngagement = async ({ senderId, receiverId, adId }) => {
  if (!senderId || !receiverId || senderId === receiverId) throw policyError(400, "Choose a different marketplace participant.");
  const users = await User.find({ uid: { $in: [senderId, receiverId] } }).lean();
  const sender = users.find(u => u.uid === senderId), receiver = users.find(u => u.uid === receiverId);
  const merchant = isActiveMerchant(sender) ? sender : isActiveMerchant(receiver) ? receiver : null;
  const buyer = isActiveBuyer(sender) ? sender : isActiveBuyer(receiver) ? receiver : null;
  if (!merchant || !buyer) throw policyError(403, "Marketplace conversations require an active buyer and merchant.");
  let ad = null;
  if (adId) {
    ad = await Ad.findOne({ _id: adId, ownerUid: merchant.uid, status: { $in: ["Approved", "Sold"] } }).lean();
    if (!ad) throw policyError(409, "This listing is unavailable or does not belong to the merchant.");
  }
  return { merchant, buyer, ad, sender, receiver };
};
