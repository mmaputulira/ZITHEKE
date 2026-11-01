import express from "express";
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { requireAdminRoles } from "../middlewares/requireAdminRoles.js";

import {
  getAllReports,
  getReportById,
  updateReportStatus,
  deleteReportedAd,
  deleteReport,
} from "../Controllers/report.admin.controller.js";

const router = express.Router();

router.use(adminAuthMiddleware, roleMiddleware("admin"), requireAdminRoles("marketplace","moderator","support"));

router.get("/", getAllReports);
router.get("/:id", getReportById);
router.put("/:id/status", updateReportStatus);
router.delete("/:id/delete-ad", deleteReportedAd);
router.delete("/:id", deleteReport);

export default router;
