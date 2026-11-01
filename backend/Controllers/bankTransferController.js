import fs from "fs";
import bankTransferService from "../Services/payments/bankTransfer.service.js";

const handleError = async (res, error, fallback) => res.status(error?.statusCode || 500).json({ success: false, message: error?.message || fallback });

export const submitProofOfPayment = async (req, res) => {
  try {
    const payment = await bankTransferService.submitBankProof({ userUid: req.user.uid, paymentId: req.params.paymentId, file: req.file, body: req.body });
    return res.status(200).json({ success: true, message: "Proof of Payment submitted for verification", payment });
  } catch (error) {
    if (req.file?.path) { try { await fs.promises.unlink(req.file.path); } catch {} }
    return handleError(res, error, "Failed to submit Proof of Payment");
  }
};

export const getPaymentReceipt = async (req, res) => {
  try { const receipt = await bankTransferService.getReceiptForUser({ userUid: req.user.uid, paymentId: req.params.paymentId }); return res.json({ success: true, receipt }); }
  catch (error) { return handleError(res, error, "Failed to load receipt"); }
};

export const viewMyProofOfPayment = async (req, res) => {
  try {
    const { payment, filePath } = await bankTransferService.getPopForUser({ userUid: req.user.uid, paymentId: req.params.paymentId });
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Proof of Payment file is unavailable" });
    res.setHeader("Content-Type", payment.popFile.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${String(payment.popFile.originalName || "proof-of-payment").replace(/["\r\n]/g, "")}"`);
    return res.sendFile(filePath);
  } catch (error) { return handleError(res, error, "Failed to load Proof of Payment"); }
};
