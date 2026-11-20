// src/hooks/useChatMessages.js
import api from "../api/axios.js";

// How long to wait for the live connection to confirm a message before
// sending it the ordinary way instead.
const SOCKET_ACK_TIMEOUT_MS = 8000;

const friendlySendError = (err) => {
  const status = err?.response?.status;
  const serverMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || "";
  if (!navigator.onLine) return "You're offline. Check your connection and tap to retry.";
  if (status === 401) return "Your session has ended. Please sign in again.";
  if (status === 429) return "You're sending messages too quickly. Wait a moment and retry.";
  if (/marketplace conversations require|different marketplace participant/i.test(serverMessage)) {
    return "This person can't receive messages right now.";
  }
  if (/unavailable|does not belong/i.test(serverMessage)) return "This listing is no longer available.";
  if (status && status < 500 && serverMessage) return serverMessage;
  return "Message not sent. Tap to retry.";
};

/**
 * useChatMessages
 * --------------------------------------------------
 * ✅ Pagination (before + limit + append)
 * ✅ Optimistic UI (tempId)
 * ✅ Dedupe (by _id OR clientTempId)
 * ✅ Socket + HTTP fallback
 * ✅ Delivery / Read helpers (exported for useChatSocket)
 */
export const useChatMessages = ({
  userId,
  setMessages,
  setConversations,
  socketRef,
}) => {
  /* =====================================================
     🔁 HELPERS
  ===================================================== */

  // 🔹 Prevent duplicate messages
  const isDuplicate = (prev, newMsg) =>
    prev.some(
      (m) =>
        (newMsg._id && m._id === newMsg._id) ||
        (newMsg.clientTempId &&
          m.clientTempId === newMsg.clientTempId)
    );

  // 🔹 Replace temp message with real one
  const replaceTempMessage = (prev, realMsg) =>
    prev.map((m) =>
      m.clientTempId &&
      realMsg.clientTempId &&
      m.clientTempId === realMsg.clientTempId
        ? realMsg
        : m
    );

  /* =====================================================
     📩 LOAD MESSAGES (PAGINATION)
     loadMessages({ conversationId, before, limit, append })
  ===================================================== */
  const loadMessages = async ({
    conversationId,
    before,
    limit = 30,
    append = false,
  }) => {
    if (!conversationId) return;

    const qs = new URLSearchParams();
    if (before) qs.append("before", before);
    if (limit) qs.append("limit", limit);

    const res = await api.get(`/messages/${conversationId}?${qs.toString()}`);

    const fetched = res.data || [];

    setMessages((prev) => {
      if (!append) return fetched;

      // prepend older messages
      const merged = [...fetched, ...prev];
      const deduped = [];
      for (const m of merged) {
        if (!isDuplicate(deduped, m)) deduped.push(m);
      }
      return deduped;
    });

    // 🔹 mark as read
    await api.put(`/conversations/${conversationId}/mark-read/${userId}`, {});

    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  /* =====================================================
     📤 SEND MESSAGE
     - Optimistic UI + tempId
     - Socket primary, HTTP fallback
  ===================================================== */
  const sendMessage = async ({
    text,
    payload,
    selectedChat,
    clearText,
  }) => {
    if (!selectedChat || !userId) return;

    let finalPayload = payload;

    // TEXT fallback
    if (!finalPayload) {
      if (!text || !text.trim()) return;
      finalPayload = {
        type: "text",
        message: text.trim(),
      };
    }

    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const data = {
      senderId: userId,
      receiverId: selectedChat.withUserId,
      adId: selectedChat.adId || null,
      productTitle: selectedChat.productTitle || "Listing",
      productImage: selectedChat.productImage || "",
      type: finalPayload.type || "text",
      message: finalPayload.message || "",
      mediaUrl: finalPayload.mediaUrl || "",
      clientTempId: tempId,
    };

    // 🔥 OPTIMISTIC UI (push temp msg)
    const tempMessage = {
      ...data,
      _id: tempId,
      clientTempId: tempId,
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
    };

    setMessages((prev) =>
      isDuplicate(prev, tempMessage)
        ? prev
        : [...prev, tempMessage]
    );

    clearText?.();

    const applySaved = (saved) =>
      setMessages((prev) => {
        const replaced = replaceTempMessage(prev, saved);
        if (replaced !== prev) return replaced;
        if (isDuplicate(prev, saved)) return prev;
        return [...prev, saved];
      });

    const markFailed = (err) => {
      console.warn("Message send failed:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.clientTempId === tempId
            ? { ...m, sendFailed: true, sendError: friendlySendError(err), retryPayload: { data } }
            : m
        )
      );
    };

    await deliver(data, applySaved, markFailed);
  };

  /* =====================================================
     📮 DELIVER: live connection first, ordinary request
     as fallback. Every path ends in "saved" or "failed",
     so a message can no longer sit on "Sending..." forever.
  ===================================================== */
  const sendOverHttp = async (data) => {
    const res = await api.post("/messages", data);
    if (!res?.data) throw new Error("Empty response");
    return res.data;
  };

  const deliver = async (data, onSaved, onFailed) => {
    const socket = socketRef?.current;

    if (socket && socket.connected) {
      const ack = await new Promise((resolve) => {
        socket.timeout(SOCKET_ACK_TIMEOUT_MS).emit("message:send", data, (err, response) => {
          resolve(err ? null : response);
        });
      });

      if (ack?.success && ack.message) return onSaved(ack.message);

      // Rejected by the server for a business reason: show it, don't resend.
      if (ack && ack.error && !/unauthori|session/i.test(ack.error)) {
        return onFailed({ message: ack.error, response: { status: 400, data: { message: ack.error } } });
      }
      // No answer (connection dropped or token expired): fall through to HTTP.
    }

    try {
      onSaved(await sendOverHttp(data));
    } catch (err) {
      onFailed(err);
    }
  };

  /* =====================================================
     🔁 RETRY A FAILED MESSAGE
  ===================================================== */
  const retryMessage = async (failedMsg) => {
    const data = failedMsg?.retryPayload?.data;
    if (!data) return;
    const tempId = data.clientTempId;

    setMessages((prev) =>
      prev.map((m) =>
        m.clientTempId === tempId ? { ...m, sendFailed: false, sendError: "" } : m
      )
    );

    await deliver(
      data,
      (saved) =>
        setMessages((prev) => replaceTempMessage(prev, saved)),
      (err) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.clientTempId === tempId
              ? { ...m, sendFailed: true, sendError: friendlySendError(err) }
              : m
          )
        )
    );
  };

  /* =====================================================
     🗑️ DELETE FOR ME
  ===================================================== */
  const deleteForMe = async (messageId) => {
    await api.put(`/messages/delete-me/${messageId}`, {});

    setMessages((prev) =>
      prev.filter((m) => m._id !== messageId)
    );
  };

  /* =====================================================
     🚫 DELETE FOR EVERYONE (OPTIMISTIC)
  ===================================================== */
  const deleteForEveryone = async (messageId) => {
    if (socketRef?.current) {
      socketRef.current.emit("message:delete-everyone", messageId);
    }

    // optimistic UI
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? {
              ...m,
              isDeleted: true,
              type: "deleted",
              message: "This message was deleted",
            }
          : m
      )
    );

    // backend confirm
    try {
      await api.put(`/messages/delete-everyone/${messageId}`, {});
    } catch (err) {
      console.error("Delete for everyone failed:", err);
    }
  };

  /* =====================================================
     📦 DELIVERY / READ HELPERS
     (used by useChatSocket.js)
  ===================================================== */

  const applyDelivered = ({ messageId, deliveredAt }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, isDelivered: true, deliveredAt }
          : m
      )
    );
  };

  const applyRead = ({ messageId, readAt }) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? { ...m, isRead: true, readAt }
          : m
      )
    );
  };

  return {
    loadMessages,
    sendMessage,
    retryMessage,
    deleteForMe,
    deleteForEveryone,

    // 🔥 export helpers for socket handlers
    applyDelivered,
    applyRead,
  };
};
