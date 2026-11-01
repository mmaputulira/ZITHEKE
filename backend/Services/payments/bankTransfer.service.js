import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Payment from "../../models/Payment.js";
import PaymentEvent from "../../models/PaymentEvent.js";
import { PAYMENT_GATEWAYS } from "../../constants/paymentGateways.js";
import { PAYMENT_STATUSES } from "../../constants/paymentStatuses.js";
import { PAYMENT_VERIFICATION_STATUSES } from "../../constants/paymentVerificationStatuses.js";
import subscriptionService from "./subscription.service.js";
import { paymentPopDir, validatePopSignature } from "../../middlewares/privatePopUpload.js";

const createError = (statusCode, message) => { const error = new Error(message); error.statusCode = statusCode; return error; };
const validId = (value) => mongoose.Types.ObjectId.isValid(value);
const resolveUser = async (uid) => {
  const user = await User.findOne({ uid }).select("_id uid name email phone");
  if (!user) throw createError(404, "Authenticated user not found");
  return user;
};
const paymentQuery = (id) => Payment.findById(id).populate({ path: "subscriptionId", populate: [{ path: "planId" }, { path: "adId" }] }).populate("userId", "name email phone");
const safeDelete = async (filePath) => { try { if (filePath) await fs.promises.unlink(filePath); } catch {} };

export const submitBankProof = async ({ userUid, paymentId, file, body = {} }) => {
  if (!validId(paymentId)) { await safeDelete(file?.path); throw createError(400, "Invalid paymentId"); }
  const user = await resolveUser(userUid);
  const payment = await Payment.findOne({ _id: paymentId, userId: user._id }).populate({ path: "subscriptionId", populate: [{ path: "planId" }, { path: "adId" }] });
  if (!payment) { await safeDelete(file?.path); throw createError(404, "Payment not found"); }
  if (payment.gateway !== PAYMENT_GATEWAYS.BANK) { await safeDelete(file?.path); throw createError(409, "Proof of Payment upload is only available for National Bank transfers"); }
  if (payment.status === PAYMENT_STATUSES.PAID && payment.verificationStatus === PAYMENT_VERIFICATION_STATUSES.VERIFIED) { await safeDelete(file?.path); throw createError(409, "This payment has already been verified"); }
  if (!file) throw createError(400, "Proof of Payment file is required");
  if (!(await validatePopSignature(file))) { await safeDelete(file.path); throw createError(400, "The uploaded file content does not match an allowed JPG, PNG or PDF format"); }

  const claimed = Number(body.amountPaid);
  if (!Number.isFinite(claimed) || claimed <= 0) { await safeDelete(file.path); throw createError(400, "A valid amount paid is required"); }
  if (Math.abs(claimed - Number(payment.amount || 0)) > 0.009) { await safeDelete(file.path); throw createError(400, "Amount paid must match the selected subscription amount"); }
  const paymentDate = new Date(body.paymentDate);
  if (Number.isNaN(paymentDate.getTime())) { await safeDelete(file.path); throw createError(400, "A valid payment date is required"); }

  const oldFilename = payment.popFile?.filename || "";
  const nextVersion = Number(payment.popFile?.version || 0) + 1;
  payment.paidAmount = claimed;
  payment.bankPaymentDate = paymentDate;
  payment.bankTransactionReference = String(body.bankTransactionReference || "").trim().slice(0, 160);
  payment.customerNote = String(body.customerNote || "").trim().slice(0, 500);
  payment.popFile = { filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size, submittedAt: new Date(), version: nextVersion };
  payment.status = PAYMENT_STATUSES.POP_SUBMITTED;
  payment.verificationStatus = PAYMENT_VERIFICATION_STATUSES.PENDING_REVIEW;
  payment.rejectionReason = "";
  payment.failureReason = "";
  await payment.save();
  if (oldFilename && oldFilename !== file.filename) await safeDelete(path.join(paymentPopDir, path.basename(oldFilename)));

  await PaymentEvent.create({ paymentId: payment._id, eventType: nextVersion > 1 ? "pop_replaced" : "pop_uploaded", source: "user", normalizedPayload: { paymentReference: payment.paymentReference, amountPaid: claimed, bankTransactionReference: payment.bankTransactionReference, popVersion: nextVersion } });
  return await paymentQuery(payment._id);
};

export const getReceiptForUser = async ({ userUid, paymentId }) => {
  if (!validId(paymentId)) throw createError(400, "Invalid paymentId");
  const user = await resolveUser(userUid);
  const payment = await Payment.findOne({ _id: paymentId, userId: user._id }).populate({ path: "subscriptionId", populate: [{ path: "planId" }, { path: "adId" }] }).populate("userId", "name email phone");
  if (!payment) throw createError(404, "Payment not found");
  return buildReceipt(payment);
};

export const getPopForUser = async ({ userUid, paymentId }) => {
  if (!validId(paymentId)) throw createError(400, "Invalid paymentId");
  const user = await resolveUser(userUid);
  const payment = await Payment.findOne({ _id: paymentId, userId: user._id });
  if (!payment?.popFile?.filename) throw createError(404, "Proof of Payment not found");
  return { payment, filePath: path.join(paymentPopDir, path.basename(payment.popFile.filename)) };
};

export const buildReceipt = (payment) => {
  const subscription = payment.subscriptionId || {};
  const plan = subscription.planId || {};
  const user = payment.userId || {};
  const isSellerMembership = String(payment.purchaseType || subscription.scope || "") === "seller_membership";
  return {
    title: isSellerMembership
      ? "Zitheke Payment Acknowledgement / Seller Subscription Receipt"
      : "Zitheke Payment Acknowledgement / Advert Boost Receipt",
    receiptReference: payment.receiptReference,
    paymentReference: payment.paymentReference,
    subscriptionReference: subscription.subscriptionReference || "",
    customer: { name: user.name || "", email: user.email || "", phone: user.phone || "" },
    package: { name: plan.name || "", slug: plan.slug || "", durationDays: Number(plan.durationDays || 0) },
    advert: subscription.adId ? { id: String(subscription.adId._id || subscription.adId), title: subscription.adId.title || "", price: subscription.adId.price ?? null, currency: subscription.adId.currency || "MWK" } : null,
    amount: Number(payment.amount || 0),
    paidAmount: payment.paidAmount == null ? null : Number(payment.paidAmount),
    currency: payment.currency || "MWK",
    paymentMethod: payment.paymentMethod,
    gateway: payment.gateway,
    paymentStatus: payment.status,
    verificationStatus: payment.verificationStatus,
    submittedAt: payment.popFile?.submittedAt || null,
    paidAt: payment.paidAt || null,
    verifiedAt: payment.verifiedAt || null,
    subscriptionStatus: subscription.status || "",
    subscriptionStartDate: subscription.startDate || null,
    subscriptionEndDate: subscription.endDate || null,
    createdAt: payment.createdAt,
    purchaseType: payment.purchaseType || subscription.scope || "ad_boost",
    disclaimer: isSellerMembership
      ? "This document is generated by Zitheke as a seller subscription payment acknowledgement. It is not a National Bank-issued receipt."
      : "This document is generated by Zitheke as a payment acknowledgement/advert boost receipt. It is not a National Bank-issued receipt.",
    poweredBy: "Restock Tech",
  };
};

export const getPopVerificationQueue = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const match = { gateway: PAYMENT_GATEWAYS.BANK };
  if (query.status) match.status = String(query.status).trim();
  if (query.verificationStatus) match.verificationStatus = String(query.verificationStatus).trim();
  const total = await Payment.countDocuments(match);
  const items = await Payment.find(match).populate("userId", "name email phone").populate({ path: "subscriptionId", populate: [{ path: "planId" }, { path: "adId" }] }).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);
  const search = String(query.search || "").trim().toLowerCase();
  const filtered = !search ? items : items.filter((p) => [p.paymentReference,p.receiptReference,p.bankTransactionReference,p.userId?.name,p.userId?.email,p.subscriptionId?.subscriptionReference,p.subscriptionId?.planId?.name,p.subscriptionId?.adId?.title].filter(Boolean).some((v)=>String(v).toLowerCase().includes(search)));
  return { items: filtered, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total/limit)) } };
};

export const getPopForAdmin = async ({ paymentId }) => {
  if (!validId(paymentId)) throw createError(400, "Invalid paymentId");
  const payment = await Payment.findById(paymentId);
  if (!payment?.popFile?.filename) throw createError(404, "Proof of Payment not found");
  return { payment, filePath: path.join(paymentPopDir, path.basename(payment.popFile.filename)) };
};

export const approveBankPayment = async ({ paymentId, adminId }) => {
  if (!validId(paymentId)) throw createError(400, "Invalid paymentId");
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) throw createError(404, "Payment not found");
      if (payment.gateway !== PAYMENT_GATEWAYS.BANK) throw createError(409, "This is not a National Bank transfer");
      if (payment.status === PAYMENT_STATUSES.PAID && payment.verificationStatus === PAYMENT_VERIFICATION_STATUSES.VERIFIED) { result = { reused: true }; return; }
      if (!payment.popFile?.filename) throw createError(409, "A Proof of Payment must be submitted before approval");
      if (payment.verificationStatus !== PAYMENT_VERIFICATION_STATUSES.PENDING_REVIEW) throw createError(409, "Payment is not awaiting POP review");
      payment.status = PAYMENT_STATUSES.PAID;
      payment.verificationStatus = PAYMENT_VERIFICATION_STATUSES.VERIFIED;
      payment.paidAt = payment.paidAt || new Date();
      payment.verifiedAt = new Date();
      payment.reviewedAt = new Date();
      payment.verifiedBy = validId(adminId) ? adminId : null;
      payment.reviewedBy = validId(adminId) ? adminId : null;
      payment.failureReason = ""; payment.rejectionReason = "";
      await payment.save({ session });
      const subscription = await subscriptionService.activateSubscriptionForVerifiedPayment({ subscriptionId: payment.subscriptionId, paymentId: payment._id, session });
      await PaymentEvent.create([{ paymentId: payment._id, eventType: "payment_approved", source: "admin", normalizedPayload: { adminId: String(adminId || ""), paymentReference: payment.paymentReference } }], { session });
      result = { reused: false, subscription };
    });
  } finally { await session.endSession(); }
  const payment = await paymentQuery(paymentId);
  return { payment, receipt: buildReceipt(payment), ...result };
};

export const rejectBankPayment = async ({ paymentId, adminId, reason }) => {
  if (!validId(paymentId)) throw createError(400, "Invalid paymentId");
  const cleanReason = String(reason || "").trim();
  if (cleanReason.length < 3) throw createError(400, "A rejection reason is required");
  const payment = await Payment.findById(paymentId);
  if (!payment) throw createError(404, "Payment not found");
  if (payment.gateway !== PAYMENT_GATEWAYS.BANK) throw createError(409, "This is not a National Bank transfer");
  if (payment.status === PAYMENT_STATUSES.PAID) throw createError(409, "Verified payments cannot be rejected");
  payment.status = PAYMENT_STATUSES.REJECTED;
  payment.verificationStatus = PAYMENT_VERIFICATION_STATUSES.REJECTED;
  payment.rejectionReason = cleanReason.slice(0, 500);
  payment.failureReason = payment.rejectionReason;
  payment.reviewedAt = new Date();
  payment.reviewedBy = validId(adminId) ? adminId : null;
  await payment.save();
  await PaymentEvent.create({ paymentId: payment._id, eventType: "payment_rejected", source: "admin", normalizedPayload: { adminId: String(adminId || ""), reason: payment.rejectionReason } });
  return await paymentQuery(paymentId);
};

export default { submitBankProof, getReceiptForUser, getPopForUser, getPopVerificationQueue, getPopForAdmin, approveBankPayment, rejectBankPayment, buildReceipt };
