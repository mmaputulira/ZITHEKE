import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    /* =====================================
       CHAT PARTICIPANTS
    ===================================== */
    participants: {
      type: [String], // [senderId, receiverId] (Firebase UID)
      required: true,
    },

    /* =====================================
       🔥 AD CONTEXT (MAIN FIX)
    ===================================== */
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      default: null,
    },

    productTitle: {
      type: String,
      default: "",
      trim: true,
    },

    productImage: {
      type: String,
      default: "",
    },

    /* =====================================
       LAST MESSAGE PREVIEW
    ===================================== */
    lastMessage: {
      type: String,
      default: "",
    },

    lastSenderId: {
      type: String,
      default: "",
    },

    lastMessageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "pdf", "file", "deleted"],
      default: "text",
    },

    /* =====================================
       🔔 UNREAD COUNTS (MAP = SAFEST)
    ===================================== */
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    /* =====================================
       SORTING (SIDEBAR ORDER)
    ===================================== */
    updatedAtSort: {
      type: Date,
      default: Date.now,
    },
    trashedAt: { type: Date, default: null, index: true },
    purgeAfter: { type: Date, default: null, index: true },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

/* ================================================
   INDEXES (PERFORMANCE OPTIMIZED)
================================================ */

// 🔥 Fast lookup for user chats
ConversationSchema.index({ participants: 1 });

// 🔥 Sorting for sidebar
ConversationSchema.index({ updatedAtSort: -1 });

// 🔥 Same users can chat on multiple ads
ConversationSchema.index({ participants: 1, adId: 1 });

export default mongoose.model("Conversation", ConversationSchema);

