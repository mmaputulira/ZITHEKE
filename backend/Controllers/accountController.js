import User from "../models/User.js";
import Session from "../models/Session.js";
import { publicAccount, canStartSelling } from "../utils/marketplacePolicy.js";
export const getAccount = async (req,res) => res.json({ user: publicAccount(await User.findOne({ uid: req.user.uid }).lean()) });
export const applyForMerchant = async (req,res) => {
  const businessName = String(req.body.businessName || "").trim().slice(0,160);
  if (!businessName) return res.status(400).json({ message: "Enter your business name." });
  const user = await User.findOne({ uid: req.user.uid });
  if (user.accountType !== "buyer") return res.status(409).json({ message: "Selling is already switched on for your account." });
  if (user.merchantApplication?.requestedAt && user.merchantStatus === "pending") return res.status(409).json({ message: "Your merchant application is already awaiting review." });
  user.merchantStatus = "pending";
  user.merchantApplication = { businessName, note: String(req.body.note || "").slice(0,1000), requestedAt: new Date() };
  await user.save(); res.json({ user: publicAccount(user), message: "Merchant application sent. Your account remains a buyer until approval." });
};
// "Start selling": a buy-only account switches selling on for itself, like
// posting your first item on Facebook Marketplace. Same login, same profile,
// same chats. Staff can still suspend selling from the admin panel.
export const startSelling = async (req,res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: "We couldn't find your account. Please sign in again." });
    if (user.accountType === "merchant" && (user.merchantStatus || "active") === "active") return res.json({ user: publicAccount(user), message: "Selling is already switched on for your account." });
    if (!canStartSelling(user)) {
      return res.status(403).json({ message: user.merchantStatus === "suspended"
        ? "Selling is paused on your account. Please contact Zitheke support."
        : "Selling isn't available on your account yet. Please contact Zitheke support." });
    }
    const businessName = String(req.body?.businessName || "").trim().slice(0,160);
    user.accountType = "merchant";
    user.merchantStatus = "active";
    user.merchantApplication = { ...(user.merchantApplication?.toObject?.() || user.merchantApplication || {}), businessName: businessName || user.merchantApplication?.businessName || "", requestedAt: user.merchantApplication?.requestedAt || new Date(), reviewedAt: new Date(), reason: "Selling switched on by the account holder." };
    await user.save();
    res.json({ user: publicAccount(user), message: "Selling is on. You can now post items with the same account." });
  } catch (error) {
    console.error("startSelling", error);
    res.status(500).json({ message: "We couldn't switch selling on just now. Please try again." });
  }
};
export const reviewMerchant = async (req,res) => {
  const action = req.body.action;
  if (!["approve","reject","suspend","restore"].includes(action)) return res.status(400).json({ message: "Invalid review action." });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Account not found." });
  if (action === "approve" && (!user.merchantApplication?.requestedAt || user.merchantStatus !== "pending")) return res.status(409).json({ message: "No pending merchant application." });
  if (["suspend","restore"].includes(action) && user.accountType !== "merchant") return res.status(409).json({ message: "This is not a merchant account." });
  if (action === "reject" && user.merchantStatus !== "pending") return res.status(409).json({ message: "No pending application." });
  user.merchantStatus = { approve:"active", reject:"rejected", suspend:"suspended", restore:"active" }[action];
  if (action === "approve") user.accountType = "merchant";
  user.merchantApplication = { ...(user.merchantApplication?.toObject?.() || user.merchantApplication || {}), reviewedAt: new Date(), reviewedBy: req.admin.id, reason: String(req.body.reason || "").slice(0,500) };
  await user.save();
  await Session.updateMany({ userUid: user.uid, revokedAt: null }, { $set: { revokedAt: new Date() } });
  req.io?.in(user.uid).disconnectSockets(true);
  res.json({ user: publicAccount(user), message: "Merchant status updated. Sign in again to use the new account type." });
};
