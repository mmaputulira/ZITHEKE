import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MessageCircle, PackageCheck, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../api/axios.js";
import { formatPrice } from "../../utils/formatPrice.js";

const labels = { PENDING_SELLER:"New purchase request", ACCEPTED:"Accepted", DECLINED:"Declined", CANCELLED:"Buyer cancelled", COMPLETED:"Completed" };

export default function SalesOrders(){
  const navigate=useNavigate(); const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  const load=async()=>{try{setLoading(true);const {data}=await api.get('/orders/me?role=seller');setOrders(data?.orders||[]);}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const act=async(order,action)=>{try{await api.patch(`/orders/${order._id}`,{action});await load();}catch(e){Swal.fire('Unable to update order',e?.response?.data?.message||'Please try again.','error')}};
  if(loading)return <div className="p-8 text-slate-500">Loading sales…</div>;
  return <div className="mx-auto max-w-6xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E3192]/55">Seller Centre</p><h1 className="mt-1 text-3xl font-bold text-[#1A1D64]">Sales & Purchase Requests</h1><p className="mt-2 text-sm text-slate-500">Accept genuine buyers, arrange payment/collection directly, then mark the sale complete.</p></div>
    {!orders.length?<div className="rounded-3xl border border-dashed bg-white p-12 text-center text-slate-500">No purchase requests yet.</div>:<div className="grid gap-4">{orders.map(o=><article key={o._id} className="rounded-3xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="flex-1"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#EEF1FF] px-3 py-1 text-xs font-bold text-[#2E3192]">{labels[o.status]||o.status}</span><span className="text-xs text-slate-400">{o.orderReference}</span></div><h2 className="mt-2 text-lg font-bold">{o.titleSnapshot}</h2><p className="text-xl font-bold text-[#2E3192]">{formatPrice(o.amount)}</p><p className="mt-1 text-xs text-slate-500">Buyer: {o.buyerName || 'Zitheke buyer'} · {o.source==='accepted_offer'?'Accepted negotiated offer':'Listing price'}</p></div><div className="flex flex-wrap gap-2">{o.status==='PENDING_SELLER'?<><button onClick={()=>act(o,'accept')} className="inline-flex items-center gap-2 rounded-full bg-[#2E3192] px-4 py-2 text-sm font-semibold text-white"><CheckCircle2 size={15}/>Accept</button><button onClick={()=>act(o,'decline')} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"><XCircle size={15}/>Decline</button></>:null}{o.status==='ACCEPTED'?<><button onClick={()=>navigate(`/chats/${o.buyerUid}`)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-[#2E3192]"><MessageCircle size={15}/>Message Buyer</button><button onClick={()=>act(o,'complete')} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><PackageCheck size={15}/>Complete Sale</button></>:null}</div></div></article>)}</div>}
  </div>
}
