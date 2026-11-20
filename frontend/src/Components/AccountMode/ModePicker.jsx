import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShoppingBag, Store, Check, Loader2 } from "lucide-react";
import { RoleCharacter, LiveAvatar } from "./Avatars.jsx";
import { useAuth, homeForMode } from "../../context/AuthContext.jsx";

const friendlyError = (error) =>
  error?.response?.data?.message || "We couldn't switch selling on just now. Please try again.";

/**
 * Shown once after signing in: "How do you want to use Zitheke?"
 * Customer and Seller share the same account, chats and profile.
 */
export default function ModePicker() {
  const { user, mode, setMode, finishModeChoice, startSelling } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState("");
  const reduce = useReducedMotion();

  if (!user) return null;

  const sellerLocked = !user.canSell && !user.canStartSelling;

  const choose = async (next) => {
    setError("");
    if (next === "seller" && !user.canSell) {
      if (sellerLocked) return;
      setBusy("seller");
      try {
        await startSelling();
      } catch (err) {
        setError(friendlyError(err));
        setBusy("");
        return;
      }
    }
    setMode(next);
    finishModeChoice();
    setBusy("");
    // Stay on a listing the person was opening; otherwise go to that side's home.
    if (!location.pathname.startsWith("/ad/")) navigate(homeForMode(next), { replace: true });
  };

  const options = [
    {
      key: "buyer",
      title: "Customer",
      text: "Browse, chat with sellers, make offers and buy.",
      Icon: ShoppingBag,
    },
    {
      key: "seller",
      title: "Seller",
      text: user.canSell
        ? "Post items, manage your ads, offers and orders."
        : sellerLocked
          ? "Selling is paused on this account. Contact Zitheke support."
          : "Start selling with this same account. No new profile needed.",
      Icon: Store,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-picker-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl sm:rounded-3xl"
          initial={reduce ? false : { y: 60, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.1 }}
            >
              <LiveAvatar user={user} mode={hovered || mode} size={68} />
            </motion.div>
            <h2 id="mode-picker-title" className="mt-3 text-lg font-bold text-gray-900">
              Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="mt-1 text-sm text-gray-500">How would you like to use Zitheke today? You can switch any time from your profile picture.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {options.map(({ key, title, text }, index) => {
              const active = mode === key;
              const disabled = Boolean(busy) || (key === "seller" && sellerLocked);
              return (
                <motion.button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => choose(key)}
                  onHoverStart={() => setHovered(key)}
                  onHoverEnd={() => setHovered("")}
                  onFocus={() => setHovered(key)}
                  onBlur={() => setHovered("")}
                  initial={reduce ? false : { y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 + index * 0.08 }}
                  whileHover={disabled || reduce ? undefined : { y: -4 }}
                  whileTap={disabled || reduce ? undefined : { scale: 0.97 }}
                  className={`relative flex flex-col items-center rounded-2xl border p-3 pb-4 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3192] ${
                    active ? "border-[#2E3192] bg-[#2E3192]/5 shadow-[0_10px_30px_rgba(46,49,146,0.15)]" : "border-gray-200 hover:border-[#2E3192]/50 hover:bg-gray-50"
                  } ${disabled && busy !== key ? "opacity-60" : ""}`}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2E3192] text-white"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="relative">
                    <RoleCharacter role={key} size={84} active={active} hovered={hovered === key} />
                    {busy === key && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                        <Loader2 size={24} className="animate-spin text-[#2E3192]" />
                      </span>
                    )}
                  </span>
                  <span className="mt-2 text-sm font-semibold text-gray-900">{title}</span>
                  <span className="mt-1 text-xs leading-snug text-gray-500">{text}</span>
                </motion.button>
              );
            })}
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">{error}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact Customer / Seller switch for menus.
 */
export function ModeSwitch({ onSwitched }) {
  const { user, mode, setMode, startSelling } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const sellerLocked = !user.canSell && !user.canStartSelling;

  const go = async (next) => {
    if (next === mode || busy) return;
    setError("");
    if (next === "seller" && !user.canSell) {
      if (sellerLocked) { setError("Selling is paused on this account. Contact Zitheke support."); return; }
      setBusy(true);
      try { await startSelling(); } catch (err) { setError(friendlyError(err)); setBusy(false); return; }
      setBusy(false);
    }
    setMode(next);
    onSwitched?.(next);
    navigate(homeForMode(next));
  };

  return (
    <div className="px-3 py-2">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Using Zitheke as</p>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
        {[["buyer", "Customer", ShoppingBag], ["seller", "Seller", Store]].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => go(key)}
            disabled={busy}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              mode === key ? "bg-white text-[#2E3192] shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {busy && key === "seller" ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
