import User from "../models/User.js";
import Session from "../models/Session.js";
import { publicAccount } from "../utils/marketplacePolicy.js";
export const getAccount = async (req,res) => res.json({ user: publicAccount(await User.findOne({ uid: req.user.uid }).lean()) });
export const applyForMerchant = async (req,res) => {
  const businessName = String(req.body.businessName || "").trim().slice(0,160);
  if (!businessName) return res.status(400).json({ message: "Enter your business name." });
  const user = await User.findOne({ uid: req.user.uid });
  if (user.merchantApplication?.requestedAt && user.merchantStatus === "pending") return res.status(409).json({ message: "Your merchant application is already awaiting review." });
  user.merchantStatus = "pending";
  user.merchantApplication = { businessName, note: String(req.body.note || "").slice(0,1000), requestedAt: new Date() };
  await user.save(); res.json({ user: publicAccount(user), message: "Merchant application sent. Your account remains a buyer until approval." });
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
