import React from "react";
const StatCard=({label,value,hint,icon:Icon})=><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-[#1c2454]">{value}</p>{hint&&<p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>{Icon&&<div className="rounded-xl bg-[#EEF1FF] p-2.5 text-[#2E3192]"><Icon size={19}/></div>}</div></div>;
export default StatCard;
