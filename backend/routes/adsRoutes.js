import { requireMerchant } from "../middlewares/marketplaceAuth.js";
import express from "express";
import {
  createAd,
  optimizeListingDraft,
  getUserAds,
  getAllAds,
  getAdById,
  updateAd,
  deleteAd,
  markAsSold,
  enableFeaturedAd,
  disableFeaturedAd,
  incrementView,
  searchAds,
  getPromoAds,
} from "../Controllers/adController.js";

// 🔐 AUTH MIDDLEWARE
import authMiddleware from "../middlewares/authMiddleware.js";

// 🔐 OWNER / ADMIN PERMISSION MIDDLEWARE
import adPermissionMiddleware from "../middlewares/adPermissionMiddleware.js";

// 🔥 Multer Error Handler
import multerErrorHandler from "../middlewares/multerErrorHandler.js";
import { adUpload } from "../middlewares/localUpload.js";

const router = express.Router();

/* =============================
        🔹 ROUTES START
============================= */

/* =================================================
   🟢 CREATE AD (LOGIN REQUIRED)
================================================= */
router.post(
  "/create",
  authMiddleware,
  requireMerchant,
  adUpload,
  multerErrorHandler,
  createAd
);

router.post("/optimize-listing", authMiddleware,
  requireMerchant, optimizeListingDraft);

/* =================================================
   👤 GET LOGGED-IN USER ADS
================================================= */
router.get("/user/:uid", authMiddleware,
  requireMerchant, getUserAds);

/* =================================================
   🔎 SEARCH ADS (PUBLIC)
================================================= */
router.get("/search/ads", searchAds);

/* =================================================
   ⭐ GET PROMO ADS (HOMEPAGE / SECTIONS)
   - Public
   - Lightweight
================================================= */
router.get("/promo", getPromoAds);


/* =================================================
   🌍 GET ALL APPROVED ADS (PUBLIC)
================================================= */
router.get("/", getAllAds);

/* =================================================
   👁️ INCREMENT VIEW COUNT (PUBLIC)
================================================= */
router.put("/:id/view", incrementView);

/* =================================================
   💰 MARK AD AS SOLD (OWNER / ADMIN)
================================================= */
router.put(
  "/:id/sold",
  authMiddleware,
  requireMerchant,
  adPermissionMiddleware,
  markAsSold
);

/* =================================================
   ⭐ FEATURE AD (OWNER PREMIUM / ADMIN)
================================================= */
router.put(
  "/:id/feature",
  authMiddleware,
  requireMerchant,
  adPermissionMiddleware,
  enableFeaturedAd
);

router.delete(
  "/:id/feature",
  authMiddleware,
  requireMerchant,
  adPermissionMiddleware,
  disableFeaturedAd
);

/* =================================================
   ✏️ UPDATE AD (OWNER / ADMIN)
================================================= */
router.put(
  "/:id",
  authMiddleware,
  requireMerchant,
  adPermissionMiddleware,
  adUpload,
  multerErrorHandler,
  updateAd
);

/* =================================================
   ❌ DELETE AD (OWNER / ADMIN)
================================================= */
router.delete(
  "/:id",
  authMiddleware,
  requireMerchant,
  adPermissionMiddleware,
  deleteAd
);

/* =================================================
   🟣 GET SINGLE AD BY ID (PUBLIC)
   🔒 REGEX GUARD — ALWAYS LAST
================================================= */
router.get("/:id", getAdById);


/* =============================
        🔹 ROUTES END
============================= */

export default router;
