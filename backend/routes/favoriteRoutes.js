import { requireBuyer } from "../middlewares/marketplaceAuth.js";
import express from "express";

// 🔐 AUTH MIDDLEWARE
import authMiddleware from "../middlewares/authMiddleware.js";

// ❤️ FAVORITES CONTROLLER
import {
  toggleFavorite,
  getFavorites,
} from "../Controllers/favoriteController.js";

const router = express.Router();

/* =====================================================
   ❤️ TOGGLE FAVORITE (ADD / REMOVE)
   🔐 LOGIN REQUIRED
   PUT /api/favorites/toggle
===================================================== */
router.put(
  "/toggle",
  authMiddleware, requireBuyer,
  toggleFavorite
);

/* =====================================================
   🧾 GET LOGGED-IN USER FAVORITES
   🔐 LOGIN REQUIRED
   GET /api/favorites/:userId
   ⚠️ userId verified via JWT inside controller
===================================================== */
router.get(
  "/:userId",
  authMiddleware, requireBuyer,
  getFavorites
);

export default router;
