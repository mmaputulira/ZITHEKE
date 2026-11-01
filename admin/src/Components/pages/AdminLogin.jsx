import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, LockKeyhole, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await axios.post("/api/admin/auth/login", form);
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminData", JSON.stringify(res.data.admin));
      if(res.data.admin?.mustChangePassword){navigate('/admin');return;}
      await Swal.fire({ icon:"success", title:"Welcome back", text:"Zitheke Administration is ready.", timer:1300, showConfirmButton:false, confirmButtonColor:"#2E3192" });
      navigate("/admin");
    } catch (err) {
      Swal.fire({ icon:"error", title:"Sign-in failed", text:err?.response?.data?.message || "Please check your email and password.", confirmButtonColor:"#2E3192" });
    } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF1FF] via-white to-[#FFF7E6] px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl grid lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden lg:flex relative flex-col justify-between bg-[#20256F] p-12 text-white overflow-hidden">
          <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-[#F4B400]/20 blur-2xl" />
          <div className="relative">
            <img src="/branding/zitheke.png" alt="Zitheke" className="h-24 w-24 rounded-3xl bg-white/95 p-2 object-contain shadow-lg" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[.25em] text-[#F7C84B]">Marketplace Administration</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">Operate Zitheke with clarity.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/75">Manage payments, subscriptions, advert boosts, reconciliation, moderation, users and marketplace performance from one secure workspace.</p>
          </div>
          <div className="relative flex items-center gap-3 border-t border-white/15 pt-7 text-xs text-white/65">
            <span>Powered by</span><img src="/branding/restock-tech-white-lockup.png" alt="Restock Tech" className="h-9 w-auto object-contain opacity-95" />
          </div>
        </section>
        <section className="p-7 sm:p-10 lg:p-12">
          <div className="lg:hidden flex items-center justify-between gap-4 mb-8">
            <img src="/branding/zitheke.png" alt="Zitheke" className="h-16 w-16 rounded-2xl object-contain" />
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-gray-400"><span>Powered by</span><img src="/branding/restock-tech-lockup.png" alt="Restock Tech" className="h-7 w-auto" /></div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF1FF] px-3 py-1.5 text-xs font-bold text-[#2E3192]"><ShieldCheck size={15}/>Secure Admin Access</div>
          <h2 className="mt-5 text-3xl font-black text-[#1c2454]">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to the Zitheke Marketplace Operations Centre.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block"><span className="text-sm font-semibold text-gray-700">Email address</span><div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@zitheke.com" className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 outline-none transition focus:border-[#2E3192] focus:bg-white focus:ring-4 focus:ring-[#2E3192]/10" required /></div></label>
            <label className="block"><span className="text-sm font-semibold text-gray-700">Password</span><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 outline-none transition focus:border-[#2E3192] focus:bg-white focus:ring-4 focus:ring-[#2E3192]/10" required /></div></label>
            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2E3192] py-3.5 font-bold text-white shadow-lg shadow-[#2E3192]/20 transition hover:bg-[#242873] disabled:opacity-60">{loading && <Loader2 size={18} className="animate-spin"/>}{loading ? "Signing in..." : "Sign in to Admin"}</button>
          </form>
          <p className="mt-8 text-center text-xs text-gray-400">Authorized Zitheke personnel only. Administrative actions may be audited.</p>
        </section>
      </div>
    </div>
  );
};
export default AdminLogin;
