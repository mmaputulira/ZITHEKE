import { requireBuyer, requireMerchant } from "../middlewares/marketplaceAuth.js";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createOffer, listOffers, respondToOffer, toggleFollow, followStatus,
  followedSellers, togglePriceAlert, listPriceAlerts, sellerAnalytics,
  marketplaceSummary,
} from "../Controllers/marketplaceExperienceController.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/summary", marketplaceSummary);
router.get("/analytics", requireMerchant, sellerAnalytics);
router.post("/offers", requireBuyer, createOffer);
router.get("/offers", listOffers);
router.patch("/offers/:offerId", respondToOffer);
router.post("/follows/toggle", requireBuyer, toggleFollow);
router.get("/follows/:sellerUid/status", requireBuyer, followStatus);
router.get("/follows", requireBuyer, followedSellers);
router.post("/price-alerts/toggle", requireBuyer, togglePriceAlert);
router.get("/price-alerts", requireBuyer, listPriceAlerts);

export default router;
