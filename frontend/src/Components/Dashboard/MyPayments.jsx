import React, { useEffect, useState } from "react";
import { Download, Eye, FileUp, Loader2, Printer, RefreshCw } from "lucide-react";
import {
  getMyProofOfPaymentBlob,
  getPaymentReceipt,
  listPaymentHistory,
  uploadBankProofOfPayment,
} from "../../services/membership.service.js";
import { downloadReceiptHtml, printReceipt } from "../../utils/paymentReceipt.js";

const statusLabel = (payment) => {
  const status = String(payment?.status || "").toLowerCase();
  const verification = String(payment?.verificationStatus || "").toLowerCase();
  if (status === "paid" && verification === "verified") return "Payment Confirmed";
  if (status === "pop_submitted" || verification === "pending_review") return "POP Submitted · Under Review";
  if (status === "rejected" || verification === "rejected") return "Payment Rejected";
  if (["failed", "expired", "cancelled"].includes(status)) return "Payment Failed";
  return "Awaiting Payment";
};

const badgeClass = (payment) => {
  const label = statusLabel(payment);
  if (label.includes("Verified")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (label.includes("Rejected") || label.includes("Failed")) return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState("");

  const load = async () => {
    try { setLoading(true); setPayments(await listPaymentHistory()); setError(""); }
    catch (err) { setError(err?.response?.data?.message || err?.message || "Failed to load payments."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const receiptAction = async (paymentId, action) => {
    try { const receipt = await getPaymentReceipt(paymentId); action(receipt); }
    catch (err) { setError(err?.response?.data?.message || err?.message || "Could not load receipt."); }
  };

  const viewPop = async (paymentId) => {
    try { const blob = await getMyProofOfPaymentBlob(paymentId); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); setTimeout(()=>URL.revokeObjectURL(url), 60000); }
    catch (err) { setError(err?.response?.data?.message || err?.message || "Could not open Proof of Payment."); }
  };

  const replacePop = async (payment, file) => {
    if (!file) return;
    try {
      setUploadingId(payment._id); setError("");
      await uploadBankProofOfPayment({ paymentId: payment._id, file, amountPaid: payment.amount, paymentDate: new Date().toISOString().slice(0,10), bankTransactionReference: payment.bankTransactionReference || "", customerNote: "Replacement POP submitted from My Payments" });
      await load();
    } catch (err) { setError(err?.response?.data?.message || err?.message || "Could not upload replacement POP."); }
    finally { setUploadingId(""); }
  };

  return <div className="mx-auto max-w-6xl py-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E3192]/60">Account & Billing</p><h1 className="mt-2 text-3xl font-bold text-[#1c2454]">My Payments</h1><p className="mt-2 text-sm text-slate-500">Track seller subscriptions, advert boosts, POP review status and Zitheke-generated receipts.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#2E3192]"><RefreshCw size={15}/>Refresh</button></div>
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="mt-8 flex min-h-[18rem] items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white text-slate-500"><Loader2 className="animate-spin"/>Loading payments...</div> : payments.length === 0 ? <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">No seller subscription or advert boost payments yet.</div> : <div className="mt-6 space-y-4">{payments.map((p)=>{
      const sub=p.subscriptionId||{}; const plan=sub.planId||{}; const advert=sub.adId||{}; const isMembership=(p.purchaseType||sub.scope)==="seller_membership"; const canReplace=p.gateway==="bank" && (p.status==="rejected" || p.verificationStatus==="rejected");
      return <div key={p._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#1c2454]">{plan.name || (isMembership ? "Seller Subscription" : "Advert Boost")}</h2><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(p)}`}>{statusLabel(p)}</span></div><div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3"><Meta label="Payment Ref" value={p.paymentReference || p.merchantTransactionId}/><Meta label={isMembership ? "Subscription ID" : "Boost ID"} value={sub.subscriptionReference || String(sub._id||"")}/><Meta label={isMembership ? "Service" : "Advert"} value={isMembership ? "Seller Account Subscription" : (advert.title || "—")}/><Meta label="Amount" value={`${p.currency || "MWK"} ${Number(p.amount||0).toLocaleString("en-MW")}`}/><Meta label="Method" value={p.paymentMethod}/><Meta label="Duration" value={`${Number(plan.durationDays||0)} days`}/><Meta label="Date" value={new Date(p.createdAt).toLocaleDateString("en-MW")}/></div>{p.rejectionReason && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><strong>Verification note:</strong> {p.rejectionReason}</div>}</div>
      <div className="grid min-w-[220px] gap-2"><button onClick={()=>receiptAction(p._id,downloadReceiptHtml)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2E3192]/20 px-4 py-2 text-sm font-semibold text-[#2E3192]"><Download size={15}/>Download Receipt</button><button onClick={()=>receiptAction(p._id,printReceipt)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2E3192]/20 px-4 py-2 text-sm font-semibold text-[#2E3192]"><Printer size={15}/>Print / Save PDF</button>{p.popFile?.filename && <button onClick={()=>viewPop(p._id)} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"><Eye size={15}/>View My POP</button>}{canReplace && <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2E3192] px-4 py-2 text-sm font-semibold text-white"><FileUp size={15}/>{uploadingId===p._id?"Uploading...":"Replace POP"}<input type="file" className="hidden" accept="image/jpeg,image/png,application/pdf" disabled={uploadingId===p._id} onChange={(e)=>replacePop(p,e.target.files?.[0])}/></label>}</div></div></div>;
    })}</div>}
  </div>;
};

const Meta=({label,value})=><div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</span><p className="mt-1 break-all font-medium text-slate-700">{value || "—"}</p></div>;
export default MyPayments;
