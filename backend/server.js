import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import { resolvePrincipal, validateEngagement } from "./Services/marketplaceIdentity.service.js";
// 🌐 server.js — Alinafe + Zitheke Real-Time Chat + Ads Backend

import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";

// ROUTES
import adRoutes from "./routes/adsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminMessageRoutes from "./routes/adminMessageRoutes.js";
import reportRoutes from "./routes/report.routes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import sellerStatsRoutes from "./routes/sellerStatsRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import marketplaceExperienceRoutes from "./routes/marketplaceExperienceRoutes.js";
import trendingRoutes from "./routes/trending.routes.js";
import publicSellerRoutes from "./routes/publicSellerRoutes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminOperationsRoutes from "./routes/adminOperationsRoutes.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import adminAuthMiddleware from "./middlewares/adminAuthMiddleware.js";
import adminAuditMiddleware from "./middlewares/adminAuditMiddleware.js";
import adminReportRoutes from "./routes/adminReports.routes.js";
import searchRoutes from "./routes/searchRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import emailRoutes from "./routes/email.routes.js";
import phoneAuthRoutes from "./routes/phoneAuth.routes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import ogPreviewRoutes from "./routes/ogPreview.routes.js";
import planRoutes from "./routes/planRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import paymentReconciliationService from "./Services/payments/paymentReconciliation.service.js";
import subscriptionExpiryService from "./Services/payments/subscriptionExpiry.service.js";





  



// MODELS
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import User from "./models/User.js";
import ContactMessage from "./models/ContactMessage.js";

// Presence utilities
import {
  setUserOnline,
  setUserOffline,
  setTyping,
  getSocketId
} from "./Services/presenceService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
let io;
let subscriptionExpiryTimer = null;
let trashRetentionTimer = null;

// allowed frontends
const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",

  // Zitheke Production
  "https://zitheke.com",
  "https://www.zitheke.com",
  "https://admin.zitheke.com",
  "https://api.zitheke.com",
];

const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);


// BODY PARSERS
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

// Production-safe baseline security headers.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// 🌍 GLOBAL CORS — FINAL FIXED VERSION
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn("Blocked by CORS:", origin);
    // Return false instead of throwing to avoid noisy 500s for blocked origins.
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Express v5-safe preflight handling (avoid app.options("*", ...))
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") return next();
  return cors(corsOptions)(req, res, () => res.sendStatus(204));
});

// Attach io reference for controllers/routes.
app.use((req, res, next) => {
  req.io = io;
  next();
});





// STATIC UPLOADS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

// Variant fallback protection:
// medium -> original -> thumb
// thumb  -> original
app.get("/uploads/images/:variant/:filename", (req, res, next) => {
  const { variant, filename } = req.params;
  const safeFile = path.basename(String(filename || ""));
  const safeVariant = String(variant || "").toLowerCase();

  if (!safeFile || safeFile !== filename) {
    return res.status(400).json({ message: "Invalid image path" });
  }

  const originalPath = path.join(uploadsPath, "images", safeFile);
  const mediumPath = path.join(uploadsPath, "images", "medium", safeFile);
  const thumbPath = path.join(uploadsPath, "images", "thumb", safeFile);

  const trySend = (filePath) => {
    if (!fs.existsSync(filePath)) return false;
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    res.sendFile(filePath);
    return true;
  };

  if (safeVariant === "medium") {
    if (trySend(mediumPath)) return;
    if (trySend(originalPath)) return;
    if (trySend(thumbPath)) return;
    return next();
  }

  if (safeVariant === "thumb") {
    if (trySend(thumbPath)) return;
    if (trySend(originalPath)) return;
    return next();
  }

  return next();
});

// STATIC FILES
app.use("/uploads", express.static(uploadsPath));

/* =========================
   PUBLIC / AUTH ROUTES
   (NO JWT REQUIRED)
========================= */
/* =========================
   🔐 ADMIN AUTH (NO JWT)
========================= */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many admin login attempts. Try again later." },
});
app.use("/api/admin/auth/login", adminLoginLimiter);
app.use("/api/admin/auth", adminAuthRoutes);

/* =========================
   🌍 PUBLIC ROUTES (NO JWT)
========================= */
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/marketplace", marketplaceExperienceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/reports", adminAuthMiddleware, adminAuditMiddleware, adminReportRoutes); // ADMIN
app.use("/api/trending", trendingRoutes);
app.use("/api/public/sellers", publicSellerRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/categories", categoryRoutes);

app.use("/api/email", emailRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth/phone", phoneAuthRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);


/* =========================
   🔐 PROTECTED ADMIN ROUTES
   (JWT + ROLE REQUIRED)
========================= */

/**
 * ⚠️ IMPORTANT ORDER
 * analytics → messages → core admin
 */

// Central admin authentication + immutable audit logging for operational actions.
app.use("/api/admin", adminAuthMiddleware, adminAuditMiddleware);
app.use("/api/admin", adminOperationsRoutes);

// 📊 ADMIN ANALYTICS (MOST SPECIFIC)
app.use("/api/admin", adminAuthMiddleware, adminAnalyticsRoutes);

// 💬 ADMIN MESSAGES
app.use("/api/admin", adminAuthMiddleware, adminMessageRoutes);

// 🛠️ ADMIN CORE (users, ads, approvals, etc.)
app.use("/api/admin", adminAuthMiddleware, adminRoutes);

/* =========================
   🧑‍💼 SELLER ROUTES
========================= */
app.use("/api/sellers", sellerStatsRoutes);
app.use("/api/sellers", sellerRoutes);

/* =========================
   🏠 ROOT & 404
========================= */
app.use("/", ogPreviewRoutes);

app.get("/", (req, res) => {
  res.send("🔥 Alinafe + Zitheke API Running");
});

app.use((req, res) =>
  res.status(404).json({ message: "Route not found" })
);

app.use((err, req, res, next) => {
  console.error("Unhandled express error:", err);
  if (res.headersSent) return next(err);
  return res.status(err?.statusCode || 500).json({
    message: err?.message || "Internal server error",
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});


// ===============================
//       SOCKET.IO v4.8.1
// ===============================

// ===============================
//       SOCKET.IO (FIXED)
// ===============================

io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.warn("Blocked Socket CORS:", origin);
      return callback(new Error("Socket CORS blocked"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // 🔥 IMPORTANT
});


// 🔌 Attach io to req (for controllers)
// AUTH SOCKET
io.use(async (socket, next) => {
  try { const principal = await resolvePrincipal(socket.handshake.auth?.token); socket.userId = principal.uid; socket.principal = principal; next(); }
  catch { next(new Error("Unauthorized socket")); }
});

// ===============================
//       SOCKET CONNECTION
// ===============================
io.on("connection", async (socket) => {
  const userId = socket.userId;
  // Revalidate every incoming event so revoked sessions cannot keep using an open socket.
  socket.use(async (packet, next) => {
    try { socket.principal = await resolvePrincipal(socket.handshake.auth?.token); next(); }
    catch {
      // Tell the app straight away so it can resend over HTTP with a renewed
      // token, instead of waiting for an answer that never comes.
      const ack = Array.isArray(packet) ? packet[packet.length - 1] : null;
      if (typeof ack === "function") {
        try { ack({ success: false, error: "Session expired" }); } catch {}
      }
      socket.disconnect(true);
      next(new Error("Session unavailable"));
    }
  });

  console.log(`🟢 User Connected: ${userId}`);
  setUserOnline(userId, socket.id);

  try {
    await User.updateOne({ uid: userId }, { lastSeen: new Date() });

  // 🔹 Personal room (for direct delivery)
  socket.join(userId);

  // =========================================================
  // 📥 Deliver Offline Messages
  // =========================================================
    const offline = await Message.find({
      receiverId: userId,
      isDelivered: false,
    })
      .sort({ createdAt: 1 })
      .limit(200);

    if (offline.length > 0) {
      // Canonical event used by the current frontend. Keep the legacy alias during rollout.
      socket.emit("message:deliver-batch", offline);
      socket.emit("message:batch-deliver", offline);

      const ids = offline.map((m) => m._id);
      const deliveredAt = new Date();
      await Message.updateMany(
        { _id: { $in: ids } },
        { isDelivered: true, deliveredAt }
      );
      for (const offlineMessage of offline) {
        io.to(offlineMessage.senderId).emit("message:delivered", {
          messageId: offlineMessage._id.toString(),
          receiverId: userId,
          deliveredAt,
        });
      }
    }
  } catch (err) {
    console.error("Socket connect bootstrap error:", err?.message || err);
  }

  // =========================================================
  // 🏠 JOIN / LEAVE CONVERSATION ROOM
  // =========================================================
  socket.on("conversation:join", async ({ conversationId } = {}) => {
    try {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select("_id");

      if (conversation) {
        socket.join(String(conversation._id));
      }
    } catch (error) {
      console.error("conversation:join authorization failed:", error?.message || error);
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    if (conversationId) socket.leave(String(conversationId));
  });

  // =========================================================
  // ✍️ TYPING INDICATOR
  // =========================================================
  socket.on("typing:update", async ({ toId, isTyping } = {}) => {
    try {
      if (!toId || toId === userId) return;

      const conversation = await Conversation.exists({
        participants: { $all: [userId, toId] },
      });
      if (!conversation) return;

      // Never trust a client-supplied sender identity.
      setTyping(userId, toId, Boolean(isTyping));

      const receiverSocket = getSocketId(toId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("typing:status", {
          fromId: userId,
          toId,
          isTyping: Boolean(isTyping),
        });
      }
    } catch (error) {
      console.error("typing:update authorization failed:", error?.message || error);
    }
  });

  // =========================================================
  // 📤 SEND MESSAGE (TEXT / MEDIA)
  // =========================================================
  socket.on("message:send", async (msg, cb = () => {}) => {
    try {
      // 🔐 BASIC VALIDATION
      if (!msg || !msg.senderId || !msg.receiverId) {
        return cb({ success: false, error: "Invalid payload" });
      }
  
      // 🔐 AUTH CHECK
      if (msg.senderId !== userId) {
        return cb({ success: false, error: "Unauthorized" });
      }
  
      const {
        senderId,
        receiverId,
        senderName,
        senderEmail,
        senderPhoto,
        receiverName,
        receiverEmail,
        receiverPhoto,
        adId,
        adTitle,
        productTitle,
        productImage,
        message,
        type,
        mediaUrl,
        mediaName,
        mediaThumbnail,
        clientTempId,
      } = msg;
  
      // Idempotent resend: return the copy already saved for this temp id.
      if (clientTempId && typeof clientTempId === "string") {
        const existing = await Message.findOne({ senderId, clientTempId }).lean();
        if (existing) return cb({ success: true, message: existing });
      }

      /* -------------------------------
         PREVIEW TEXT
      -------------------------------- */
      let effectiveTitle = "Listing";
      let effectiveImage = "";
      const effectiveAdId = adId || null;
      const engagement = await validateEngagement({ senderId, receiverId, adId: effectiveAdId });
      effectiveTitle = engagement.ad?.title || "Merchant enquiry";
      effectiveImage = engagement.ad?.images?.[0] || "";

      let previewText = message || "";
      if (type && type !== "text") {
        if (type === "image") previewText = "[Photo]";
        else if (type === "video") previewText = "[Video]";
        else if (type === "pdf") previewText = mediaName || "[PDF]";
        else previewText = mediaName || "[Attachment]";
      }
  
      /* -------------------------------
         FIND / CREATE CONVERSATION
      -------------------------------- */
      let convo = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        adId: effectiveAdId,
      });
  
      if (!convo) {
        convo = await Conversation.create({
          participants: [senderId, receiverId],
          adId: effectiveAdId,
          productTitle: effectiveTitle,
          productImage: effectiveImage,
          unreadCounts: {
            [senderId]: 0,
            [receiverId]: 1,
          },
          lastMessage: previewText,
          lastMessageType: type || "text",
          lastSenderId: senderId,
          updatedAtSort: new Date(),
        });
      } else {
        convo.lastMessage = previewText;
        convo.lastMessageType = type || "text";
        convo.lastSenderId = senderId;
        convo.updatedAtSort = new Date();
        const currentUnread = typeof convo.unreadCounts?.get === "function"
          ? Number(convo.unreadCounts.get(receiverId) || 0)
          : Number(convo.unreadCounts?.[receiverId] || 0);
        if (typeof convo.unreadCounts?.set === "function") convo.unreadCounts.set(receiverId, currentUnread + 1);
        else convo.set(`unreadCounts.${receiverId}`, currentUnread + 1);
        await convo.save();
      }
  
      /* -------------------------------
         SAVE MESSAGE
      -------------------------------- */
      const saved = await Message.create({
        conversationId: convo._id,
        senderId,
        receiverId,
        senderName: engagement.sender.name,
        senderEmail: engagement.sender.email,
        senderPhoto: engagement.sender.photoURL,
        receiverName: engagement.receiver.name,
        receiverEmail: engagement.receiver.email,
        receiverPhoto: engagement.receiver.photoURL,
        adTitle: effectiveTitle,
        message: message || "",
        type: type || "text",
        mediaUrl: mediaUrl || "",
        mediaName: mediaName || "",
        mediaThumbnail: mediaThumbnail || "",
        clientTempId: clientTempId || null,
        isRead: false,
        isDelivered: false,
      });
  
      /* -------------------------------
         DELIVER TO RECEIVER
         (FIXED EMIT TARGET)
      -------------------------------- */
      const receiverSocketId = getSocketId(receiverId);
  
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message:new", saved);
  
        const deliveredAt = new Date();
        await Message.updateOne(
          { _id: saved._id },
          { isDelivered: true, deliveredAt }
        );
        io.to(senderId).emit("message:delivered", {
          messageId: saved._id.toString(),
          receiverId,
          deliveredAt,
        });
      }
  
      // ✅ ALWAYS ACK
      cb({ success: true, message: saved });
    } catch (err) {
      console.error("❌ message:send error:", err);
      cb({ success: false, error: err.message });
    }
  });
  

  // =========================================================
  // 🗑️ DELETE MESSAGE FOR EVERYONE (🔥 MAIN FIX)
  // =========================================================
  socket.on("message:delete-everyone", async (messageId) => {
    console.log("🔥 SOCKET DELETE EVENT HIT:", messageId, "by", userId);

    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // 🔐 Only sender can delete for everyone
      if (msg.senderId !== userId) return;

      // 🧹 SOFT DELETE (DB LEVEL)
      msg.isDeleted = true;
      msg.message = "";
      msg.mediaUrl = "";
      msg.type = "deleted";
      msg.deletedAt = new Date();

      await msg.save();

      // 🔊 Notify both users in conversation room
      io.to(msg.conversationId.toString()).emit(
        "message:deleted-everyone",
        messageId
      );
    } catch (err) {
      console.error("❌ delete-everyone error:", err);
    }
  });

  // =========================================================
  // 👁️ MESSAGE SEEN
  // =========================================================
  socket.on("message:seen", async ({ conversationId } = {}) => {
    try {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select("_id participants");
      if (!conversation) return;

      await Message.updateMany(
        { conversationId, receiverId: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      const readAt = new Date();
      const otherUid = conversation.participants.find((participant) => participant !== userId);
      if (otherUid) {
        io.to(otherUid).emit("message:read", {
          conversationId: String(conversation._id),
          readAt,
          readBy: userId,
        });
        // Legacy alias retained for older clients during rollout.
        io.to(otherUid).emit("message:update-seen", { userId, readAt });
      }
    } catch (error) {
      console.error("message:seen authorization failed:", error?.message || error);
    }
  });

  // =========================================================
  // 🔴 DISCONNECT
  // =========================================================
  socket.on("disconnect", async () => {
    console.log(`🔴 User disconnected: ${userId}`);
    setUserOffline(userId);

    try {
      await User.updateOne({ uid: userId }, { lastSeen: new Date() });
    } catch (err) {
      console.error("Socket disconnect cleanup error:", err?.message || err);
    }
  });
});


// START SERVER
app.use((err, req, res, next) => {
  console.error("Unhandled route error:", err?.message || err);
  if (res.headersSent) return next(err);
  return res.status(err?.status || 500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const purgeExpiredTrash = async () => {
  const now = new Date();
  try {
    await ContactMessage.deleteMany({ trashedAt: { $ne: null }, purgeAfter: { $lte: now } });
    const expiredConversations = await Conversation.find({ trashedAt: { $ne: null }, purgeAfter: { $lte: now } }).select("_id").lean();
    if (expiredConversations.length) {
      const ids = expiredConversations.map((row) => row._id);
      await Message.deleteMany({ conversationId: { $in: ids } });
      await Conversation.deleteMany({ _id: { $in: ids } });
    }
  } catch (error) {
    console.error("Trash retention cleanup failed:", error?.message || error);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    await new Promise((resolve, reject) => {
      const handleListenError = (error) => reject(error);
      server.once("error", handleListenError);
      server.listen(PORT, () => {
        server.off("error", handleListenError);
        console.log(`✅ Alinafe/Zitheke Server running on PORT ${PORT}`);
        resolve();
      });
    });

    paymentReconciliationService.startPaymentReconciliationScheduler();
    const expiryIntervalMs = Math.max(60_000, Number(process.env.SUBSCRIPTION_EXPIRY_INTERVAL_MS || 300_000));
    const runBoostExpiry = () => subscriptionExpiryService.runExpirySync({ source: "scheduled_boost_expiry" }).catch((err) => console.error("Boost expiry sync failed:", err?.message || err));
    runBoostExpiry();
    subscriptionExpiryTimer = setInterval(runBoostExpiry, expiryIntervalMs);
    purgeExpiredTrash();
    trashRetentionTimer = setInterval(purgeExpiredTrash, 6 * 60 * 60 * 1000);
  } catch (error) {
    console.error("❌ Backend startup failed:", error?.message || error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`Shutdown signal received: ${signal}`);
  try {
    paymentReconciliationService.stopPaymentReconciliationScheduler();
    if (subscriptionExpiryTimer) clearInterval(subscriptionExpiryTimer);
    if (trashRetentionTimer) clearInterval(trashRetentionTimer);
    await new Promise((resolve) => server.close(resolve));
    if (io) io.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Shutdown error:", err?.message || err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
