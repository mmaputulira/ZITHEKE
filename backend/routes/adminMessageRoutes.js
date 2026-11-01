import express from "express";

// 🔐 Middlewares
import adminAuthMiddleware from "../middlewares/adminAuthMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { requireAdminRoles } from "../middlewares/requireAdminRoles.js";

// 💬 Controllers
import {
  getAllConversations,
  getMessagesForAdmin,
  deleteConversationForAdmin,
  restoreConversationForAdmin,
  purgeConversationForAdmin,
} from "../Controllers/adminMessageController.js";

const router = express.Router();

/* =====================================================
   🔐 ADMIN ACCESS ONLY
===================================================== */
router.use(adminAuthMiddleware, roleMiddleware("admin"), requireAdminRoles("support","moderator"));

/* =====================================================
   💬 ADMIN CHAT MONITORING
===================================================== */

// ✅ Get all conversations (platform wide)
router.get("/conversations", getAllConversations);

// ✅ Get messages of a specific conversation
router.get("/messages/:conversationId", getMessagesForAdmin);

// ✅ Delete a specific conversation with all messages
router.delete("/conversations/:conversationId", deleteConversationForAdmin);
router.patch("/conversations/:conversationId/restore", restoreConversationForAdmin);
router.delete("/conversations/:conversationId/purge", purgeConversationForAdmin);

export default router;
