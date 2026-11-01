import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { listMyNotifications } from "../Controllers/notificationController.js";
const router = express.Router();
router.get("/", authMiddleware, listMyNotifications);
export default router;
