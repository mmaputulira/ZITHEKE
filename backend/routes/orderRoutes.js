import { requireBuyer } from "../middlewares/marketplaceAuth.js";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createOrder, listMyOrders, updateOrderStatus } from "../Controllers/orderController.js";

const router = express.Router();
router.use(authMiddleware);
router.post("/", requireBuyer, createOrder);
router.get("/me", listMyOrders);
router.patch("/:orderId", updateOrderStatus);
export default router;
