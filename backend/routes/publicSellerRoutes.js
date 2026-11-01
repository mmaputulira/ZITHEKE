import express from "express";
import { getPublicSellerAds, getSellerDirectory } from "../Controllers/publicSellerController.js";

const router = express.Router();
router.get("/", getSellerDirectory);

/* =====================================================
   🌍 PUBLIC SELLER ROUTES
===================================================== */

/* =====================================================
   🏪 GET SELLER ADS (PUBLIC)
   GET /api/public/sellers/:sellerId/ads
===================================================== */
router.get("/:sellerId/ads", (req, res, next) => {
  const { sellerId } = req.params;

  if (!sellerId || typeof sellerId !== "string") {
    return res.status(400).json({ message: "Invalid seller id" });
  }

  next();
}, getPublicSellerAds);

export default router;
