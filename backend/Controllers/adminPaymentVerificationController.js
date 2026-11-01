import fs from "fs";
import bankTransferService from "../Services/payments/bankTransfer.service.js";
const handleError = (res, error, fallback) => res.status(error?.statusCode || 500).json({ success: false, message: error?.message || fallback });

export const listPopVerificationQueue = async (req, res) => {
  try { const result = await bankTransferService.getPopVerificationQueue(req.query); return res.json({ success: true, data: result.items, pagination: result.pagination }); }
  catch (error) { return handleError(res, error, "Failed to load POP verification queue"); }
};
export const viewPopAsAdmin = async (req, res) => {
  try { const { payment, filePath } = await bankTransferService.getPopForAdmin({ paymentId: req.params.paymentId }); if (!fs.existsSync(filePath)) return res.status(404).json({ success:false, message:"Proof of Payment file is unavailable" }); res.setHeader("Content-Type", payment.popFile.mimeType || "application/octet-stream"); res.setHeader("Content-Disposition", `inline; filename="${String(payment.popFile.originalName || "proof-of-payment").replace(/["\r\n]/g, "")}"`); return res.sendFile(filePath); }
  catch (error) { return handleError(res, error, "Failed to load Proof of Payment"); }
};
export const approvePopPayment = async (req, res) => {
  try { const result = await bankTransferService.approveBankPayment({ paymentId: req.params.paymentId, adminId: req.admin?.id }); return res.json({ success:true, message: result.reused ? "Payment was already verified" : "Payment verified and subscription activated", ...result }); }
  catch (error) { return handleError(res, error, "Failed to approve payment"); }
};
export const rejectPopPayment = async (req, res) => {
  try { const payment = await bankTransferService.rejectBankPayment({ paymentId: req.params.paymentId, adminId: req.admin?.id, reason: req.body?.reason }); return res.json({ success:true, message:"Payment rejected. Customer can submit a replacement POP.", payment }); }
  catch (error) { return handleError(res, error, "Failed to reject payment"); }
};
