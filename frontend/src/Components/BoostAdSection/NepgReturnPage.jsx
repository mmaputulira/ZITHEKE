import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../../services/membership.service.js";
import useMembershipAccess from "../../hooks/useMembershipAccess.js";

const FINAL_SUCCESS = new Set(["paid", "verified", "success"]);
const FINAL_FAILURE = new Set(["failed", "cancelled", "canceled", "expired", "rejected"]);
const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 4000;

const resolveState = (result) => {
  const values = [
    result?.verification?.status,
    result?.verification?.verificationStatus,
    result?.payment?.status,
    result?.payment?.verificationStatus,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  if (values.some((value) => FINAL_SUCCESS.has(value))) return "success";
  if (values.some((value) => FINAL_FAILURE.has(value))) return "failed";
  return "pending";
};

const NepgReturnPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const paymentId = params.get("paymentId") || "";
  const { refreshAccess } = useMembershipAccess();
  const [state, setState] = useState(paymentId ? "verifying" : "error");
  const [message, setMessage] = useState(
    paymentId ? "Confirming your payment with NEPG..." : "The NEPG return link is missing the Zitheke payment reference."
  );
  const [attempts, setAttempts] = useState(0);
  const stoppedRef = useRef(false);

  const checkPayment = useCallback(async () => {
    if (!paymentId || stoppedRef.current) return;
    try {
      setState("verifying");
      const result = await verifyPayment(paymentId);
      if (stoppedRef.current) return;

      const next = resolveState(result);
      if (next === "success") {
        stoppedRef.current = true;
        setState("success");
        setMessage("Payment confirmed. Your Zitheke purchase has been activated.");
        await refreshAccess();
        return;
      }

      if (next === "failed") {
        stoppedRef.current = true;
        setState("failed");
        setMessage(
          result?.verification?.customerMessage ||
            result?.payment?.failureReason ||
            "NEPG reported that the payment was not completed."
        );
        return;
      }

      setAttempts((current) => {
        const nextAttempt = current + 1;
        if (nextAttempt >= MAX_ATTEMPTS) {
          stoppedRef.current = true;
          setState("pending");
          setMessage("Your payment is still being processed. You can safely check it again from My Payments.");
        } else {
          window.setTimeout(checkPayment, RETRY_DELAY_MS);
        }
        return nextAttempt;
      });
    } catch (error) {
      if (stoppedRef.current) return;
      const responseMessage = error?.response?.data?.message || error?.message || "Could not confirm the NEPG payment yet.";
      setAttempts((current) => {
        const nextAttempt = current + 1;
        if (nextAttempt >= MAX_ATTEMPTS) {
          stoppedRef.current = true;
          setState("pending");
          setMessage(`${responseMessage} You can check the payment again from My Payments.`);
        } else {
          setMessage("We are still waiting for NEPG to confirm the final payment status...");
          window.setTimeout(checkPayment, RETRY_DELAY_MS);
        }
        return nextAttempt;
      });
    }
  }, [paymentId, refreshAccess]);

  useEffect(() => {
    stoppedRef.current = false;
    if (paymentId) checkPayment();
    return () => {
      stoppedRef.current = true;
    };
  }, [paymentId, checkPayment]);

  const retry = () => {
    stoppedRef.current = false;
    setAttempts(0);
    setMessage("Confirming your payment with NEPG...");
    checkPayment();
  };

  const icon =
    state === "success" ? (
      <CheckCircle2 className="h-14 w-14 text-emerald-600" />
    ) : state === "failed" || state === "error" ? (
      <AlertCircle className="h-14 w-14 text-red-600" />
    ) : state === "verifying" ? (
      <Loader2 className="h-14 w-14 animate-spin text-[#2E3192]" />
    ) : (
      <ShieldCheck className="h-14 w-14 text-amber-600" />
    );

  return (
    <section className="min-h-[75vh] bg-gradient-to-b from-[#f8f9ff] via-white to-[#f4f6ff] px-4 py-24">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#DFE5FF] bg-white p-7 text-center shadow-[0_24px_70px_-38px_rgba(46,49,146,0.2)] md:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">{icon}</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#2E3192]/60">NEPG Payment</p>
        <h1 className="mt-2 text-3xl font-black text-[#1c2454]">
          {state === "success" ? "Payment confirmed" : state === "failed" ? "Payment not completed" : "Checking your payment"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {state !== "success" && paymentId ? (
            <button type="button" onClick={retry} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2E3192]/20 px-5 py-3 text-sm font-semibold text-[#2E3192]">
              <RefreshCw size={16} /> Check again
            </button>
          ) : null}
          <button type="button" onClick={() => navigate("/dashboard/payments")} className="rounded-full bg-[#2E3192] px-6 py-3 text-sm font-semibold text-white">
            Go to My Payments
          </button>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Powered by Restock Tech</p>
      </div>
    </section>
  );
};

export default NepgReturnPage;
