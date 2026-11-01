import express from "express";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";
import { requireAdminRoles } from "../middlewares/requireAdminRoles.js";
import { adUpload } from "../middlewares/localUpload.js";
import multerErrorHandler from "../middlewares/multerErrorHandler.js";
import { validate } from "../middlewares/validate.js";
import {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
} from "../schemas/plan.schema.js";
import {
  listPlansForAdmin,
  createPlan,
  updatePlan,
  deletePlan,
} from "../Controllers/planController.js";
import { runSubscriptionExpirySync } from "../Controllers/subscriptionController.js";
import {
  getSubscriptionAnalyticsSummary,
  getSubscriptionAnalyticsPlans,
  getSubscriptionAnalyticsSubscriptions,
  getSubscriptionAnalyticsPayments,
  reconcilePendingPayments,
} from "../Controllers/adminSubscriptionAnalyticsController.js";
import {
  getAllContactMessages,
  markMessageAsRead,
  deleteContactMessage,
  restoreContactMessage,
  purgeContactMessage,
} from "../Controllers/contactController.js";
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  updateAdminCategoryStatus,
  addAdminSubcategory,
  updateAdminSubcategory,
  updateAdminSubcategoryStatus,
  deleteAdminCategory,
  deleteAdminSubcategory,
} from "../Controllers/categoryController.js";
import {
  categoryIdParamSchema,
  subcategoryIdParamSchema,
  listCategoriesQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  categoryStatusSchema,
  createSubcategorySchema,
  updateSubcategorySchema,
  subcategoryStatusSchema,
} from "../schemas/category.schema.js";

import {
  // 👤 USERS
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,

  // 📦 ADS
  getAllAds,
  getAdById,
  approveAd,
  rejectAd,
  deleteAdByAdmin,
  getAdsStats,
  updateAdByAdmin,
  optimizeAdCopyByAdmin,
} from "../Controllers/adminController.js";

import { getAdminStats } from "../Controllers/adminOverview.controller.js";
import {
  listPopVerificationQueue,
  viewPopAsAdmin,
  approvePopPayment,
  rejectPopPayment,
} from "../Controllers/adminPaymentVerificationController.js";

const router = express.Router();

/* ======================
   ADMIN OVERVIEW
====================== */
router.get("/overview", adminAuthMiddleware, getAdminStats);

/* ======================
   ADMIN PLANS
====================== */
router.get("/plans", adminAuthMiddleware, requireAdminRoles("marketplace","finance","reporting"), listPlansForAdmin);
router.post(
  "/plans",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(createPlanSchema, "body"),
  createPlan
);
router.put(
  "/plans/:id",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(planIdParamSchema, "params"),
  validate(updatePlanSchema, "body"),
  updatePlan
);
router.delete(
  "/plans/:id",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(planIdParamSchema, "params"),
  deletePlan
);

/* ======================
   ADMIN SUBSCRIPTION ANALYTICS
====================== */
router.get(
  "/subscription-analytics/summary",
  adminAuthMiddleware,
  requireAdminRoles("finance", "reporting"),
  getSubscriptionAnalyticsSummary
);
router.get(
  "/subscription-analytics/plans",
  adminAuthMiddleware,
  requireAdminRoles("finance", "reporting"),
  getSubscriptionAnalyticsPlans
);
router.get(
  "/subscription-analytics/subscriptions",
  adminAuthMiddleware,
  requireAdminRoles("finance", "reporting"),
  getSubscriptionAnalyticsSubscriptions
);
router.get(
  "/subscription-analytics/payments",
  adminAuthMiddleware,
  requireAdminRoles("finance", "reporting"),
  getSubscriptionAnalyticsPayments
);
router.post(
  "/subscription-analytics/reconcile-pending-payments",
  adminAuthMiddleware,
  requireAdminRoles("finance"),
  reconcilePendingPayments
);


/* ======================
   ADMIN PAYMENT POP VERIFICATION
====================== */
router.get("/payments/pop-verification", adminAuthMiddleware, requireAdminRoles("finance","reporting"), listPopVerificationQueue);
router.get("/payments/:paymentId/pop", adminAuthMiddleware, requireAdminRoles("finance"), viewPopAsAdmin);
router.patch("/payments/:paymentId/pop/approve", adminAuthMiddleware, requireAdminRoles("finance"), approvePopPayment);
router.patch("/payments/:paymentId/pop/reject", adminAuthMiddleware, requireAdminRoles("finance"), rejectPopPayment);

/* ======================
   ADMIN SUBSCRIPTIONS
====================== */
router.post(
  "/subscriptions/expiry-sync",
  adminAuthMiddleware,
  requireAdminRoles("finance"),
  runSubscriptionExpirySync
);

/* ======================
   ADMIN CONTACT INBOX
====================== */
router.get("/contact/messages", adminAuthMiddleware, requireAdminRoles("support"), getAllContactMessages);
router.put(
  "/contact/messages/:id/read",
  adminAuthMiddleware,
  requireAdminRoles("support"),
  markMessageAsRead
);
router.delete(
  "/contact/messages/:id",
  adminAuthMiddleware,
  requireAdminRoles("support"),
  deleteContactMessage
);
router.patch("/contact/messages/:id/restore", adminAuthMiddleware, requireAdminRoles("support"), restoreContactMessage);
router.delete("/contact/messages/:id/purge", adminAuthMiddleware, requireAdminRoles("support"), purgeContactMessage);

/* ======================
   ADMIN CATEGORIES
====================== */
router.get(
  "/categories",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(listCategoriesQuerySchema, "query"),
  listAdminCategories
);
router.post(
  "/categories",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(createCategorySchema, "body"),
  createAdminCategory
);
router.put(
  "/categories/:categoryId",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema, "body"),
  updateAdminCategory
);
router.patch(
  "/categories/:categoryId/status",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(categoryIdParamSchema, "params"),
  validate(categoryStatusSchema, "body"),
  updateAdminCategoryStatus
);
router.post(
  "/categories/:categoryId/subcategories",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(categoryIdParamSchema, "params"),
  validate(createSubcategorySchema, "body"),
  addAdminSubcategory
);
router.put(
  "/categories/:categoryId/subcategories/:subcategoryId",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(subcategoryIdParamSchema, "params"),
  validate(updateSubcategorySchema, "body"),
  updateAdminSubcategory
);
router.patch(
  "/categories/:categoryId/subcategories/:subcategoryId/status",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(subcategoryIdParamSchema, "params"),
  validate(subcategoryStatusSchema, "body"),
  updateAdminSubcategoryStatus
);
router.delete(
  "/categories/:categoryId",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(categoryIdParamSchema, "params"),
  deleteAdminCategory
);
router.delete(
  "/categories/:categoryId/subcategories/:subcategoryId",
  adminAuthMiddleware,
  requireAdminRoles("marketplace"),
  validate(subcategoryIdParamSchema, "params"),
  deleteAdminSubcategory
);

/* ======================
   ADMIN USERS
====================== */
router.get("/users", adminAuthMiddleware, requireAdminRoles("marketplace","support","finance","moderator"), getAllUsers);
router.get("/users/:id", adminAuthMiddleware, requireAdminRoles("marketplace","support","finance","moderator"), getUserDetails);
router.put("/users/:id/ban", adminAuthMiddleware, requireAdminRoles("marketplace"), banUser);
router.put("/users/:id/unban", adminAuthMiddleware, requireAdminRoles("marketplace"), unbanUser);

/* ======================
   ADMIN ADS  🔥 (MISSING PART)
====================== */
router.get("/ads", adminAuthMiddleware, requireAdminRoles("marketplace","moderator"), getAllAds);
router.get("/ads/stats/summary", adminAuthMiddleware, requireAdminRoles("marketplace","moderator","reporting"), getAdsStats);

router.get("/ads/:id", adminAuthMiddleware, requireAdminRoles("marketplace","moderator"), getAdById);
router.post("/ads/optimize-copy", adminAuthMiddleware, requireAdminRoles("marketplace","moderator"), optimizeAdCopyByAdmin);
router.put("/ads/:id", adminAuthMiddleware, requireAdminRoles("marketplace"), adUpload, multerErrorHandler, updateAdByAdmin);
router.patch("/ads/:id/approve", adminAuthMiddleware, requireAdminRoles("marketplace","moderator"), approveAd);
router.patch("/ads/:id/reject", adminAuthMiddleware, requireAdminRoles("marketplace","moderator"), rejectAd);
router.delete("/ads/:id", adminAuthMiddleware, requireAdminRoles("marketplace"), deleteAdByAdmin);

export default router;
