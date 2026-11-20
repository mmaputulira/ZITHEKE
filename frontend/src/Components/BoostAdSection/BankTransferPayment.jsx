import { formatAmount } from "../../utils/formatPrice.js";
import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clipboard, FileUp, Loader2, ShieldCheck } from "lucide-react";
import nationalBankLogo from "../../assets/payments/national-bank-lockup.png";
import PaymentBrandMark from "./PaymentBrandMark.jsx";
import {
  createBankPaymentIntent,
  createSubscriptionIntent,
  getPaymentReceipt,
  uploadBankProofOfPayment,
} from "../../services/membership.service.js";
import { downloadReceiptHtml, printReceipt } from "../../utils/paymentReceipt.js";
import { formatCurrencyFinal } from "../../utils/currency.js";

const idempotencyKey = (planId = "", scope = "ad_boost") =>
  `bank-${scope}-${planId}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`}`;

const today = () => new Date().toISOString().slice(0, 10);

const CopyButton = ({ value }) => (
  <button type="button" onClick={() => navigator.clipboard?.writeText(String(value || ""))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-[#2E3192] hover:bg-slate-50">
    <Clipboard size={13} /> Copy
  </button>
);

const BankTransferPayment = ({ plan, adId, ad, scope = "ad_boost" }) => {
  const isSellerMembership = scope === "seller_membership";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState({ subscription: null, payment: null, initiation: null });
  const [receipt, setReceipt] = useState(null);
  const [form, setForm] = useState({ amountPaid: plan?.price || "", paymentDate: today(), bankTransactionReference: "", customerNote: "" });
  const [file, setFile] = useState(null);

  useEffect(() => {
    let active = true;
    const start = async () => {
      if (!plan?._id) return;
      setLoading(true);
      setError("");
      try {
        const subscription = await createSubscriptionIntent(plan._id, isSellerMembership ? null : adId, scope);
        const result = await createBankPaymentIntent({
          subscriptionId: subscription._id,
          idempotencyKey: idempotencyKey(plan._id, scope),
        });
        if (!active) return;
        setContext({ subscription, payment: result.payment, initiation: result.initiation });
        setForm((prev) => ({ ...prev, amountPaid: result.payment?.amount ?? plan.price }));
      } catch (err) {
        if (active) setError(err?.response?.data?.message || err?.message || "Could not prepare National Bank payment instructions.");
      } finally {
        if (active) setLoading(false);
      }
    };
    start();
    return () => { active = false; };
  }, [plan?._id, plan?.price, adId, scope, isSellerMembership]);

  const bank = context.initiation?.bankDetails || {};
  const subscriptionReference = context.payment?.subscriptionId?.subscriptionReference || context.subscription?.subscriptionReference || "";
  const expectedAmount = Number(context.payment?.amount ?? plan?.price ?? 0);
  const status = String(context.payment?.status || "").toLowerCase();
  const awaitingReview = ["pop_submitted"].includes(status);
  const canSubmit = useMemo(() => Boolean(file && context.payment?._id && !submitting), [file, context.payment?._id, submitting]);

  const submitPop = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const payment = await uploadBankProofOfPayment({ paymentId: context.payment._id, file, ...form });
      setContext((prev) => ({ ...prev, payment }));
      setMessage(
        isSellerMembership
          ? "Proof of Payment received. Your seller subscription is now awaiting review."
          : "Proof of Payment received. Your National Bank transfer is now awaiting review."
      );
      setFile(null);
      const nextReceipt = await getPaymentReceipt(payment._id);
      setReceipt(nextReceipt);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload Proof of Payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[20rem] items-center justify-center gap-3 rounded-3xl border border-[#E3E8FF] bg-white text-slate-600"><Loader2 className="animate-spin text-[#2E3192]" /> Preparing National Bank payment...</div>;
  if (error && !context.payment) return <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border border-[#E3E8FF] bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_1fr_auto] sm:items-center">
          <PaymentBrandMark src={nationalBankLogo} alt="National Bank of Malawi plc logo" variant="wide" size="panel" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2E3192]/60">National Bank Transfer</p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-[#1c2454] sm:text-2xl">Transfer, then submit your POP</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {isSellerMembership
                ? "Use the payment reference shown below so your transfer can be matched quickly to your seller account subscription."
                : "Use the payment reference shown below so your transfer can be matched quickly to the exact advert boost you selected."}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-[#DEE4FF] bg-[#EEF2FF] px-4 py-3 text-left sm:min-w-[10.5rem] sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2E3192]/60">Amount due</p>
            <p className="mt-1 whitespace-nowrap text-xl font-bold text-[#1c2454]">MWK {formatAmount(expectedAmount)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Detail label="Bank" value={bank.bankName || "National Bank"} />
          <Detail label="Account Name" value={bank.accountName || "Alinafe Online Limited"} copy />
          <Detail label="Account Number" value={bank.accountNumber || "1006477832"} copy />
          {isSellerMembership ? <Detail label="Service" value="Seller Account Subscription" /> : <Detail label="Advert" value={ad?.title || "Selected advert"} />}
          <Detail label="Package" value={`${plan?.name || ""} · ${plan?.durationDays || 0} days`} />
          <Detail label="Zitheke Payment Reference" value={context.payment?.paymentReference} copy emphasized />
          <Detail label={isSellerMembership ? "Subscription ID" : "Boost ID"} value={subscriptionReference} copy emphasized />
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <span>
            Use the <strong>Zitheke Payment Reference</strong> as your transfer/deposit narration where possible. {isSellerMembership ? "Your seller plan remains inactive" : "The selected advert remains unboosted"} until the submitted POP is reviewed and approved.
          </span>
        </div>
      </div>

      <form onSubmit={submitPop} className="rounded-[1.8rem] border border-[#E3E8FF] bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-2"><FileUp size={20} className="text-[#2E3192]" /><h3 className="text-lg font-bold text-[#1c2454]">Upload Proof of Payment</h3></div>
        <p className="mt-2 text-sm text-slate-500">Accepted: JPG, PNG or PDF up to 5 MB. Zitheke generates a separate acknowledgement; it does not replace your bank-issued POP.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Amount Paid"><input type="text" inputMode="numeric" required readOnly value={formatCurrencyFinal(form.amountPaid)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none" /></Field>
          <Field label="Payment Date"><input type="date" required value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none" /></Field>
          <Field label="Bank Transaction / Deposit Reference"><input value={form.bankTransactionReference} onChange={(e) => setForm({ ...form, bankTransactionReference: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none" placeholder="Optional if not shown on POP" /></Field>
          <Field label="Proof of Payment"><input type="file" required={!awaitingReview} accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm" /></Field>
        </div>
        <Field label="Optional Note"><textarea value={form.customerNote} onChange={(e) => setForm({ ...form, customerNote: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none" placeholder="Any information that may help us confirm your payment" /></Field>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {message ? <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{message}</div> : null}

        <button type="submit" disabled={!canSubmit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2E3192] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? <><Loader2 size={17} className="animate-spin" /> Powered by Restock Tech · Submitting...</> : "Submit Proof of Payment"}
        </button>

        {receipt ? <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => downloadReceiptHtml(receipt)} className="rounded-full border border-[#2E3192]/20 px-4 py-2 text-sm font-semibold text-[#2E3192]">Download Zitheke Receipt</button><button type="button" onClick={() => printReceipt(receipt)} className="rounded-full border border-[#2E3192]/20 px-4 py-2 text-sm font-semibold text-[#2E3192]">Print / Save as PDF</button></div> : null}
      </form>
    </div>
  );
};

const Detail = ({ label, value, copy, emphasized }) => <div className={`rounded-2xl border p-4 ${emphasized ? "border-[#2E3192]/20 bg-[#F5F6FF]" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="break-all font-bold text-[#1c2454]">{value || "—"}</p>{copy && value ? <CopyButton value={value} /> : null}</div></div>;
const Field = ({ label, children }) => <label className="block"><span className="text-sm font-semibold text-slate-700">{label}</span><div className="mt-1">{children}</div></label>;

export default BankTransferPayment;
