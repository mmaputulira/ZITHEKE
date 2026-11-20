import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Store, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// One account for buying and selling.
// - type="buyer": any signed-in account (everyone can shop).
// - type="merchant": selling must be switched on. If it isn't yet, offer to
//   switch it on here instead of sending people to a separate account.
function StartSellingPrompt() {
  const { user, startSelling, setMode } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = !user.canStartSelling;

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      await startSelling();
      setMode("seller");
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't switch selling on just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-28 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Store size={26} /></span>
      {locked ? (
        <>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Selling is paused on your account</h1>
          <p className="mt-2 text-sm text-gray-600">You can still shop as normal. Please contact Zitheke support to restore selling.</p>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Start selling on Zitheke</h1>
          <p className="mt-2 text-sm text-gray-600">Use the same account you shop with. Your profile, chats and saved items stay as they are.</p>
          <button type="button" onClick={start} disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2E3192] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#252879] disabled:opacity-70">
            {busy && <Loader2 size={16} className="animate-spin" />} Start selling
          </button>
          {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}

export default function AccountGuard({ type, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-12">Loading account…</p>;
  if (!user) return <Navigate to={type === "buyer" ? "/buyer/login" : "/login"} state={{ returnTo: location.pathname + location.search }} replace />;
  if (type === "merchant" && !user.canSell) return <StartSellingPrompt />;
  return children;
}
