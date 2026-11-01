import { useAdminAccess } from "../../AdminRoutes/AdminAccessContext.jsx";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { CheckCircle2, Eye, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { approvePopPayment, getAdminPopBlob, getPopVerificationQueue, rejectPopPayment } from "../../api/adminPaymentVerificationApi";

const badge = (value) => {
  const text = String(value || "").toLowerCase();
  if (["paid", "verified"].includes(text)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["rejected", "failed"].includes(text)) return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const PaymentVerification = () => {
 const {can}=useAdminAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [working, setWorking] = useState("");

  const load = async () => {
    try { setLoading(true); const result = await getPopVerificationQueue({ search, verificationStatus: status || undefined, limit: 100 }); setItems(result.items); setError(""); }
    catch (err) { setError(err?.response?.data?.message || err?.message || "Failed to load POP verification queue."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  const viewPop = async (paymentId) => {
    try { const blob = await getAdminPopBlob(paymentId); const url = URL.createObjectURL(blob); window.open(url, "_blank", "noopener,noreferrer"); setTimeout(()=>URL.revokeObjectURL(url),60000); }
    catch (err) { Swal.fire("POP unavailable", err?.response?.data?.message || err?.message || "Could not open POP", "error"); }
  };

  const approve = async (item) => {
    const confirm = await Swal.fire({ title: "Approve payment?", text: `Verify ${item.paymentReference || "this payment"} and activate the subscription?`, icon: "question", showCancelButton: true, confirmButtonColor: "#2E3192", confirmButtonText: "Approve & Activate" });
    if (!confirm.isConfirmed) return;
    try { setWorking(item._id); await approvePopPayment(item._id); await Swal.fire("Verified", "Payment verified and subscription activated.", "success"); await load(); }
    catch (err) { Swal.fire("Approval failed", err?.response?.data?.message || err?.message || "Could not approve payment", "error"); }
    finally { setWorking(""); }
  };

  const reject = async (item) => {
    const result = await Swal.fire({ title: "Reject POP", input: "textarea", inputLabel: "Reason shown to the customer", inputPlaceholder: "Explain why the payment could not be verified...", showCancelButton: true, confirmButtonColor: "#d33", inputValidator: (value) => !String(value || "").trim() ? "A rejection reason is required" : undefined });
    if (!result.isConfirmed) return;
    try { setWorking(item._id); await rejectPopPayment(item._id, result.value); await Swal.fire("Rejected", "The customer can now submit a replacement POP.", "success"); await load(); }
    catch (err) { Swal.fire("Rejection failed", err?.response?.data?.message || err?.message || "Could not reject payment", "error"); }
    finally { setWorking(""); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E3192]/60">Payments</p><h1 className="mt-2 text-3xl font-extrabold text-[#1c2454]">POP Verification</h1><p className="mt-2 text-sm text-gray-500">Review National Bank transfer evidence before activating the selected seller subscription or advert boost.</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#2E3192]"><RefreshCw size={15}/>Refresh</button></div>
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_220px_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&load()} placeholder="Search payment ref, subscription ID, customer or bank ref" className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2E3192]/20"/></label><select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5"><option value="">All verification states</option><option value="pending_review">Pending Review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><button onClick={load} className="rounded-2xl bg-[#2E3192] px-5 py-2.5 font-semibold text-white">Search</button></div></div>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
    {loading ? <div className="flex min-h-[18rem] items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white text-gray-500"><Loader2 className="animate-spin"/>Loading POP queue...</div> : items.length===0 ? <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-500">No National Bank POP records match these filters.</div> : <div className="space-y-4">{items.map((item)=>{ const user=item.userId||{}; const sub=item.subscriptionId||{}; const plan=sub.planId||{}; const advert=sub.adId||{}; const isMembership=(item.purchaseType||sub.scope)==="seller_membership"; const pending=item.verificationStatus==="pending_review"; return <div key={item._id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"><div className="grid gap-5 xl:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#1c2454]">{user.name || user.email || "Customer"}</h2><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge(item.verificationStatus)}`}>{item.verificationStatus}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4"><Meta label="Payment Reference" value={item.paymentReference}/><Meta label="Subscription ID" value={sub.subscriptionReference}/><Meta label={isMembership ? "Service" : "Advert"} value={isMembership ? "Seller Account Subscription" : (advert.title || "—")}/><Meta label="Package" value={`${plan.name || "—"} · ${plan.durationDays || 0} days`}/><Meta label="Expected" value={`${item.currency || "MWK"} ${Number(item.amount||0).toLocaleString("en-MW")}`}/><Meta label="Claimed Paid" value={item.paidAmount == null ? "—" : `${item.currency || "MWK"} ${Number(item.paidAmount).toLocaleString("en-MW")}`}/><Meta label="Bank Reference" value={item.bankTransactionReference}/><Meta label="Submitted" value={item.popFile?.submittedAt ? new Date(item.popFile.submittedAt).toLocaleString("en-MW") : "Not submitted"}/><Meta label="POP Version" value={item.popFile?.version || 0}/></div>{item.rejectionReason && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{item.rejectionReason}</div>}</div><div className="grid min-w-[190px] gap-2"><button disabled={!item.popFile?.filename} onClick={()=>viewPop(item._id)} className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"><Eye size={15}/>View POP</button>{pending && can("verification.write") && <><button disabled={working===item._id} onClick={()=>approve(item)} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15}/>Approve</button><button disabled={working===item._id} onClick={()=>reject(item)} className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><XCircle size={15}/>Reject</button></>}</div></div></div>; })}</div>}
  </div>;
};
const Meta=({label,value})=><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{label}</p><p className="mt-1 break-all font-medium text-gray-700">{value || "—"}</p></div>;
export default PaymentVerification;
