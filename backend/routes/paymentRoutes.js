import { requireMerchant } from "../middlewares/marketplaceAuth.js";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createPaymentIntent,
  getPaymentById,
  getPaymentHistory,
  verifyPayment,
} from "../Controllers/paymentController.js";
import {
  submitProofOfPayment,
  getPaymentReceipt,
  viewMyProofOfPayment,
} from "../Controllers/bankTransferController.js";
import { bankPopUpload } from "../middlewares/privatePopUpload.js";
import multerErrorHandler from "../middlewares/multerErrorHandler.js";
import { validate } from "../middlewares/validate.js";
import {
  createPaymentIntentSchema,
  paymentIdParamSchema,
} from "../schemas/payment.schema.js";

const router = express.Router();

router.post("/", authMiddleware, requireMerchant, validate(createPaymentIntentSchema, "body"), createPaymentIntent);
router.get("/me/history", authMiddleware, getPaymentHistory);
router.post(
  "/:paymentId/pop",
  authMiddleware,
  validate(paymentIdParamSchema, "params"),
  bankPopUpload.single("proofOfPayment"),
  multerErrorHandler,
  submitProofOfPayment
);
router.get(
  "/:paymentId/pop",
  authMiddleware,
  validate(paymentIdParamSchema, "params"),
  viewMyProofOfPayment
);
router.get(
  "/:paymentId/receipt",
  authMiddleware,
  validate(paymentIdParamSchema, "params"),
  getPaymentReceipt
);
router.post("/:paymentId/verify", authMiddleware, validate(paymentIdParamSchema, "params"), verifyPayment);
router.get("/:paymentId", authMiddleware, validate(paymentIdParamSchema, "params"), getPaymentById);

export default router;
