import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, MessageCircle, XCircle, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios.js";
import { formatPrice } from "../../utils/formatPrice.js";

const statusLabel = {
  PENDING_SELLER: "Waiting for seller",
  ACCEPTED: "Seller accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export default function MyPurchases() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/orders/me?role=buyer");
      setOrders(data?.orders || []);
    } catch (error) {
      Swal.fire("Unable to load purchases", error?.response?.data?.message || "Please try again.", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (order) => {
    const result = await Swal.fire({
      title: "Cancel this purchase request?",
      text: "The seller will no longer be expected to complete this order.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cancel request",
      confirmButtonColor: "#2E3192",
    });
    if (!result.isConfirmed) return;
    await api.patch(`/orders/${order._id}`, { action: "cancel" });
    await load();
  };

  if (loading) return <div className="p-8 text-slate-500">Loading your purchases…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E3192]/55">Buyer Centre</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1A1D64]">My Purchases</h1>
          <p className="mt-2 text-sm text-slate-500">Track items you have requested to buy and continue the conversation with the seller.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-[#2E3192]"><RefreshCw size={15}/>Refresh</button>
      </div>

      {!orders.length ? (
        <div className="rounded-3xl border border-dashed bg-white p-12 text-center">
          <ShoppingBag className="mx-auto text-[#2E3192]" size={36}/>
          <h2 className="mt-4 text-xl font-semibold text-slate-800">No purchases yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Open a listing and choose <strong>Buy / Send Request</strong>. Zitheke will create a purchase request for the seller to accept.</p>
          <button onClick={() => navigate("/browse-listings")} className="mt-6 rounded-full bg-[#2E3192] px-5 py-3 text-sm font-semibold text-white">Browse Listings</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="h-24 w-28 overflow-hidden rounded-2xl bg-slate-100 shrink-0">
                  {order.imageSnapshot ? <img src={order.imageSnapshot} alt="" className="h-full w-full object-cover"/> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2E3192]">{statusLabel[order.status] || order.status}</span>
                    <span className="text-xs text-slate-400">{order.orderReference}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{order.titleSnapshot}</h2>
                  <p className="mt-1 text-xl font-bold text-[#2E3192]">{formatPrice(order.amount)}</p>
                  <p className="mt-2 text-xs text-slate-500">Seller: {order.sellerName || "Marketplace seller"} · {order.source === "accepted_offer" ? "Agreed offer price" : "Listing price"} · Payment/collection is arranged directly with the seller.</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button onClick={() => navigate(`/ad/${order.adId?._id || order.adId}`)} className="rounded-full border px-4 py-2 text-sm font-semibold text-[#2E3192]">View Listing</button>
                  {order.status === "ACCEPTED" ? <button onClick={() => navigate(`/chats/${order.sellerUid}`)} className="inline-flex items-center gap-2 rounded-full bg-[#2E3192] px-4 py-2 text-sm font-semibold text-white"><MessageCircle size={15}/>Message Seller</button> : null}
                  {["PENDING_SELLER", "ACCEPTED"].includes(order.status) ? <button onClick={() => cancel(order)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"><XCircle size={15}/>Cancel</button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
