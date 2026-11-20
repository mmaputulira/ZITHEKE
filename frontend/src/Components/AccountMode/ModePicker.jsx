import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Store, Check, Loader2 } from "lucide-react";
import { useAuth, homeForMode } from "../../context/AuthContext.jsx";

const initialsOf = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "Z";

export const UserAvatar = ({ user, size = 56, className = "" }) => {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (user?.photoURL && !broken) {
    return <img src={user.photoURL} alt="" style={style} onError={() => setBroken(true)} className={`rounded-full object-cover ring-2 ring-white shadow ${className}`} />;
  }
  return (
    <span style={style} className={`inline-flex items-center justify-center rounded-full bg-[#2E3192] font-semibold text-white ring-2 ring-white shadow ${className}`}>
      {initialsOf(user?.name)}
    </span>
  );
};

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
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="mode-picker-title">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl sm:rounded-3xl">
        <div className="flex flex-col items-center text-center">
          <UserAvatar user={user} size={64} />
          <h2 id="mode-picker-title" className="mt-3 text-lg font-bold text-gray-900">
            Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="mt-1 text-sm text-gray-500">How would you like to use Zitheke today? You can switch any time from your profile picture.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {options.map(({ key, title, text, Icon }) => {
            const active = mode === key;
            const disabled = Boolean(busy) || (key === "seller" && sellerLocked);
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => choose(key)}
                className={`relative flex flex-col items-center rounded-2xl border p-4 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3192] ${
                  active ? "border-[#2E3192] bg-[#2E3192]/5" : "border-gray-200 hover:border-[#2E3192]/50 hover:bg-gray-50"
                } ${disabled && busy !== key ? "opacity-60" : ""}`}
              >
                {active && <Check size={16} className="absolute right-2.5 top-2.5 text-[#2E3192]" />}
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${key === "seller" ? "bg-amber-100 text-amber-700" : "bg-[#2E3192]/10 text-[#2E3192]"}`}>
                  {busy === key ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
                </span>
                <span className="mt-2 text-sm font-semibold text-gray-900">{title}</span>
                <span className="mt-1 text-xs leading-snug text-gray-500">{text}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">{error}</p>}
      </div>
    </div>
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
