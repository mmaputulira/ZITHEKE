import { reviewMerchant } from "../Controllers/accountController.js";
import { listAdminOrders } from "../Controllers/orderController.js";
import express from "express";
import { requireAdminRoles } from "../middlewares/requireAdminRoles.js";
import {
  getOperationsDashboard,
  getReconciliation,
  updateUserLifecycle,
  updateVerifiedSeller,
  getSeller360,
  bulkModerateAds,
  getRiskFlags,
  getAuditLogs,
  getSystemHealth,
  manualPaymentRecovery,
  listNotifications,
  createNotification,
  toggleNotification,
  listAdminAccess,
  updateAdminRole,
  getSupportCentre,
  getOwnAdminProfile,
  updateOwnAdminProfile,
  changeOwnAdminPassword,
} from "../Controllers/adminOperationsController.js";

const router = express.Router();

router.get("/ops/orders", requireAdminRoles("marketplace", "support", "reporting"), listAdminOrders);
router.patch("/ops/users/:id/merchant", requireAdminRoles("marketplace"), reviewMerchant);
router.get("/ops/dashboard", requireAdminRoles(), getOperationsDashboard);
router.get("/ops/reconciliation", requireAdminRoles("finance","admin","reporting"), getReconciliation);
router.patch("/ops/users/:id/status", requireAdminRoles("marketplace","admin","support"), updateUserLifecycle);
router.patch("/ops/users/:id/verified", requireAdminRoles("marketplace","admin"), updateVerifiedSeller);
router.get("/ops/users/:id/360", requireAdminRoles("marketplace","admin","support","finance","moderator"), getSeller360);
router.post("/ops/ads/bulk", requireAdminRoles("marketplace","admin","moderator"), bulkModerateAds);
router.get("/ops/risk-flags", requireAdminRoles("marketplace","admin","finance","moderator"), getRiskFlags);
router.get("/ops/audit-log", requireAdminRoles("admin","reporting"), getAuditLogs);
router.get("/ops/system-health", requireAdminRoles("admin","reporting"), getSystemHealth);
router.post("/ops/payments/:paymentId/recover", requireAdminRoles("finance","admin"), manualPaymentRecovery);
router.get("/ops/notifications", requireAdminRoles("admin","support","marketplace"), listNotifications);
router.post("/ops/notifications", requireAdminRoles("admin","support","marketplace"), createNotification);
router.patch("/ops/notifications/:id", requireAdminRoles("admin","support","marketplace"), toggleNotification);
router.get("/ops/admin-access", requireAdminRoles("admin"), listAdminAccess);
router.patch("/ops/admin-access/:id/role", requireAdminRoles("admin"), updateAdminRole);
router.get("/ops/support", requireAdminRoles("support","admin","marketplace","moderator"), getSupportCentre);

router.get("/ops/me/profile", requireAdminRoles(), getOwnAdminProfile);
router.patch("/ops/me/profile", requireAdminRoles(), updateOwnAdminProfile);
router.patch("/ops/me/password", requireAdminRoles(), changeOwnAdminPassword);

export default router;
