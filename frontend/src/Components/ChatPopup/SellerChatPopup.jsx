import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, ExternalLink, RotateCw, AlertCircle } from "lucide-react";
import api from "../../api/axios.js";
import { connectSocket } from "../../socket.js";
import { getAvatarSrc, handleAvatarFallback } from "../../utils/avatar.js";

/* =========================================================
   Seller chat pop-up on a listing page.
   - The seller's avatar pops up with a speech bubble a few
     seconds after the page opens, inviting a question.
   - Tapping it opens a small animated chat with the seller.
     Messages are real: they go through the same /messages API
     and live connection as the full Chats page, so the seller
     sees them in their inbox and replies appear here live.
========================================================= */

const QUICK_REPLIES = [
  "Hi, is this still available?",
  "What's your last price?",
  "Can you deliver?",
  "Where can we meet?",
];

const TEASER_DELAY_MS = 2500;
const seenKey = (adId) => `zitheke.chatTeaser.${adId}`;
const readSession = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };
const writeSession = (key) => { try { sessionStorage.setItem(key, "1"); } catch { /* storage blocked */ } };

const firstName = (name = "") => String(name).trim().split(/\s+/)[0] || "the seller";
const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

const friendlyError = (err) => {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message || err?.response?.data?.error || "";
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You're offline. Tap to retry.";
  if (status === 429) return "Sending too fast. Tap to retry.";
  if (/can't receive|unavailable|require an active/i.test(msg)) return "This seller can't receive messages right now.";
  return "Not sent. Tap to retry.";
};

function SellerFace({ src, name, size = 48, ring = true, online = false }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {ring && (
        <span
          aria-hidden="true"
          className="absolute -inset-[3px] rounded-full"
          style={{ background: "conic-gradient(from 0deg, #2E3192, #6C72FF, #F4B400, #2E3192)" }}
        />
      )}
      <img
        src={getAvatarSrc(src)}
        alt={name ? `${name}` : "Seller"}
        onError={handleAvatarFallback}
        className="relative h-full w-full rounded-full border-2 border-white bg-white object-cover"
      />
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#2E3192]/60"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

export default function SellerChatPopup({ ad, user }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [teaserText, setTeaserText] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sellerTyping, setSellerTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingEmit = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  const sellerUid = ad?.ownerUid;
  const sellerName = ad?.ownerName || "Seller";
  const isOwnListing = Boolean(user?.uid && user.uid === sellerUid);
  const enabled = Boolean(ad?._id && sellerUid && !isOwnListing && ["Approved", "Sold"].includes(ad?.status || "Approved"));

  /* ---------- Teaser: the seller's avatar pops up once per listing ---------- */
  useEffect(() => {
    if (!enabled || readSession(seenKey(ad._id))) return undefined;
    const timer = setTimeout(() => {
      setTeaserText(`Hi! I'm ${firstName(sellerName)}. Ask me anything about this ${ad.title ? "item" : "listing"}.`);
      setTeaser(true);
    }, TEASER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, ad?._id, ad?.title, sellerName]);

  const dismissTeaser = useCallback(() => {
    setTeaser(false);
    if (ad?._id) writeSession(seenKey(ad._id));
  }, [ad?._id]);

  /* ---------- Load the existing conversation for this listing ---------- */
  const loadConversation = useCallback(async () => {
    if (!user?.uid || !enabled) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/conversations/${user.uid}`);
      const rows = Array.isArray(data) ? data : data?.conversations || [];
      const match = rows.find((c) => String(c.adId?._id || c.adId || "") === String(ad._id) && c.withUserId === sellerUid);
      if (match?.conversationId) {
        setConversationId(String(match.conversationId));
        const res = await api.get(`/messages/${match.conversationId}?limit=30`);
        setMessages(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      /* first message will create the conversation */
    } finally {
      setLoading(false);
    }
  }, [user?.uid, enabled, ad?._id, sellerUid]);

  useEffect(() => {
    if (open) loadConversation();
  }, [open, loadConversation]);

  /* ---------- Live replies and typing from the seller ---------- */
  useEffect(() => {
    if (!user?.uid || !enabled) return undefined;
    const socket = connectSocket(user.uid);

    const onMessage = (msg) => {
      if (!msg || msg.senderId !== sellerUid || msg.receiverId !== user.uid) return;
      if (conversationId && msg.conversationId && String(msg.conversationId) !== conversationId) return;
      setSellerTyping(false);
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      if (!openRef.current) {
        setUnread((n) => n + 1);
        setTeaserText(msg.message || "Sent you an attachment");
        setTeaser(true);
      }
    };
    const onTyping = ({ fromId, isTyping } = {}) => {
      if (fromId !== sellerUid) return;
      setSellerTyping(Boolean(isTyping));
      clearTimeout(typingTimer.current);
      if (isTyping) typingTimer.current = setTimeout(() => setSellerTyping(false), 6000);
    };

    socket.on("message:new", onMessage);
    socket.on("typing:status", onTyping);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing:status", onTyping);
      clearTimeout(typingTimer.current);
    };
  }, [user?.uid, enabled, sellerUid, conversationId]);

  /* ---------- Keep the newest message in view ---------- */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, sellerTyping, open, reduce]);

  const openChat = () => {
    dismissTeaser();
    setUnread(0);
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  /* Other buttons on the page (e.g. "Chat with seller") open this pop-up. */
  useEffect(() => {
    if (!enabled) return undefined;
    const onOpen = () => openChat();
    window.addEventListener("zitheke:open-seller-chat", onOpen);
    return () => window.removeEventListener("zitheke:open-seller-chat", onOpen);
  });

  const requireSignIn = () => {
    navigate("/buyer/login", { state: { returnTo: `/ad/${ad._id}` } });
  };

  const deliver = async (tempId, body) => {
    try {
      const { data } = await api.post("/messages", {
        senderId: user.uid,
        receiverId: sellerUid,
        adId: ad._id,
        productTitle: ad.title,
        productImage: ad.images?.[0] || "",
        type: "text",
        message: body,
        clientTempId: tempId,
      });
      if (data?.conversationId) setConversationId(String(data.conversationId));
      setMessages((prev) => prev.map((m) => (m.clientTempId === tempId ? { ...data, clientTempId: tempId } : m)));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.clientTempId === tempId ? { ...m, failed: true, error: friendlyError(err) } : m)));
    }
  };

  const send = async (raw) => {
    const body = String(raw ?? text).trim();
    if (!body) return;
    if (!user) return requireSignIn();
    const tempId = `pop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setText("");
    setMessages((prev) => [...prev, { _id: tempId, clientTempId: tempId, senderId: user.uid, receiverId: sellerUid, message: body, createdAt: new Date().toISOString(), pending: true }]);
    await deliver(tempId, body);
  };

  const retry = (m) => {
    setMessages((prev) => prev.map((x) => (x.clientTempId === m.clientTempId ? { ...x, failed: false, pending: true } : x)));
    deliver(m.clientTempId, m.message);
  };

  const onType = (value) => {
    setText(value);
    if (!user?.uid) return;
    const now = Date.now();
    if (now - lastTypingEmit.current > 1500) {
      lastTypingEmit.current = now;
      try { connectSocket(user.uid).emit("typing:update", { toId: sellerUid, isTyping: true }); } catch { /* ignore */ }
    }
  };

  const fullChatLink = useMemo(
    () => (conversationId ? `/chats?conversationId=${conversationId}&receiverId=${sellerUid}` : "/chats"),
    [conversationId, sellerUid]
  );

  if (!enabled) return null;

  const pop = reduce ? {} : { type: "spring", stiffness: 520, damping: 22 };

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[60] flex flex-col items-end gap-3 font-[Poppins] sm:right-6">
      {/* ---------- Chat panel ---------- */}
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label={`Chat with ${sellerName}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ transformOrigin: "bottom right" }}
            className="flex h-[min(560px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_60px_rgba(31,35,112,0.28)]"
          >
            {/* Header */}
            <header className="relative flex items-center gap-3 bg-gradient-to-r from-[#2E3192] to-[#4F52C9] px-4 py-3 text-white">
              <motion.span initial={reduce ? false : { scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...pop, delay: 0.1 }}>
                <SellerFace src={ad.ownerImage} name={sellerName} size={42} ring={false} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{sellerName}</p>
                <p className="truncate text-xs text-white/75">{sellerTyping ? "typing…" : `About: ${ad.title || "this listing"}`}</p>
              </div>
              <button type="button" onClick={() => navigate(fullChatLink)} className="rounded-full p-2 hover:bg-white/15" aria-label="Open in Chats">
                <ExternalLink size={17} />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/15" aria-label="Close chat">
                <X size={18} />
              </button>
            </header>

            {/* Messages */}
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-gradient-to-b from-[#F6F7FF] to-white px-3 py-4">
              {loading && !messages.length && <p className="py-8 text-center text-xs text-gray-400">Loading your conversation…</p>}

              {!loading && !messages.length && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center px-4 py-6 text-center"
                >
                  <motion.span
                    animate={reduce ? undefined : { y: [0, -6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <SellerFace src={ad.ownerImage} name={sellerName} size={64} />
                  </motion.span>
                  <p className="mt-3 text-sm font-semibold text-gray-900">Chat with {firstName(sellerName)}</p>
                  <p className="mt-1 text-xs text-gray-500">Ask about price, delivery or a place to meet. {firstName(sellerName)} gets your message straight away.</p>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const mine = m.senderId === user?.uid;
                  const prev = messages[i - 1];
                  const showFace = !mine && (!prev || prev.senderId !== m.senderId);
                  return (
                    <motion.div
                      key={m.clientTempId || m._id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, scale: 0.6, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={pop}
                      style={{ transformOrigin: mine ? "bottom right" : "bottom left" }}
                      className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {!mine && (
                        <span className="w-7 shrink-0">
                          {showFace && (
                            <motion.span initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ ...pop, delay: 0.05 }} className="block">
                              <SellerFace src={ad.ownerImage} name={sellerName} size={28} ring={false} />
                            </motion.span>
                          )}
                        </span>
                      )}
                      <div className="max-w-[78%]">
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                            mine ? "rounded-br-md bg-[#2E3192] text-white" : "rounded-bl-md border border-[#2E3192]/10 bg-white text-gray-900"
                          } ${m.pending ? "opacity-80" : ""}`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.message || (m.type && m.type !== "text" ? "📎 Attachment" : "")}</p>
                          <p className={`mt-0.5 text-right text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
                            {m.pending && !m.failed ? "Sending…" : timeOf(m.createdAt)}
                          </p>
                        </div>
                        {m.failed && (
                          <button type="button" onClick={() => retry(m)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
                            <AlertCircle size={12} /> {m.error} <RotateCw size={11} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {sellerTyping && (
                  <motion.div
                    key="typing"
                    initial={reduce ? false : { opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={pop}
                    style={{ transformOrigin: "bottom left" }}
                    className="flex items-end gap-2"
                  >
                    <SellerFace src={ad.ownerImage} name={sellerName} size={28} ring={false} />
                    <span className="rounded-2xl rounded-bl-md border border-[#2E3192]/10 bg-white px-3 py-1.5 shadow-sm">
                      <TypingDots />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick replies */}
            {!messages.some((m) => m.senderId === user?.uid) && (
              <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 scrollbar-hide">
                {QUICK_REPLIES.map((q, i) => (
                  <motion.button
                    key={q}
                    type="button"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                    onClick={() => send(q)}
                    className="whitespace-nowrap rounded-full border border-[#2E3192]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#2E3192] hover:bg-[#2E3192]/5"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5"
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => onType(e.target.value)}
                placeholder={user ? `Message ${firstName(sellerName)}…` : "Sign in to message the seller"}
                onFocus={() => { if (!user) requireSignIn(); }}
                maxLength={2000}
                className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2E3192]/30"
              />
              <motion.button
                type="submit"
                whileTap={reduce ? undefined : { scale: 0.88, rotate: -12 }}
                disabled={!text.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E3192] text-white shadow-md transition disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={17} />
              </motion.button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---------- Teaser bubble that pops up with the seller's avatar ---------- */}
      <AnimatePresence>
        {!open && teaser && (
          <motion.div
            key="teaser"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 30, scale: 0.7 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            style={{ transformOrigin: "bottom right" }}
            className="relative max-w-[260px] cursor-pointer rounded-2xl rounded-br-md border border-[#2E3192]/10 bg-white px-4 py-3 pr-8 text-sm text-gray-800 shadow-[0_14px_40px_rgba(31,35,112,0.18)]"
            onClick={openChat}
          >
            <p className="text-xs font-semibold text-[#2E3192]">{sellerName}</p>
            <TeaserText text={teaserText} reduce={reduce} />
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(e) => { e.stopPropagation(); dismissTeaser(); }}
              className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Launcher: the seller's face ---------- */}
      <motion.button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? "Close chat" : `Chat with ${sellerName}`}
        initial={reduce ? false : { scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.6 }}
        whileHover={reduce ? undefined : { scale: 1.06 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(31,35,112,0.3)]"
      >
        {!open && !reduce && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#2E3192]/25"
            animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2E3192] text-white">
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span key="face" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative">
              <SellerFace src={ad.ownerImage} name={sellerName} size={56} />
              <span className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#F4B400] text-[#1A1D64] ring-2 ring-white">
                <MessageCircle size={13} />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={pop}
              className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// Types the teaser out briefly after a "typing" moment.
function TeaserText({ text, reduce }) {
  const [typing, setTyping] = useState(!reduce);
  useEffect(() => {
    if (reduce) return undefined;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 900);
    return () => clearTimeout(t);
  }, [text, reduce]);
  return (
    <div className="mt-0.5 min-h-[20px]">
      <AnimatePresence mode="wait" initial={false}>
        {typing ? (
          <motion.span key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TypingDots />
          </motion.span>
        ) : (
          <motion.p key="text" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="line-clamp-3 leading-snug">
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
