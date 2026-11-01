import { useAdminAccess } from "../../AdminRoutes/AdminAccessContext.jsx";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Save, Mail, Phone, User, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import adminApi from "../../api/adminApi";

const Field = ({ label, icon: Icon, ...props }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon size={16}/>{label}</span>
    <input {...props} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#2E3192] focus:bg-white focus:ring-4 focus:ring-[#2E3192]/10"/>
  </label>
);

const AdminSettings = () => {
 const {can}=useAdminAccess();
  const [profile,setProfile]=useState({name:"",email:"",phone:"",role:""});
  const [password,setPassword]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{(async()=>{try{const r=await adminApi.get('/ops/me/profile');setProfile(r.data?.data||profile)}catch(e){Swal.fire('Could not load settings',e?.response?.data?.message||e.message,'error')}finally{setLoading(false)}})()},[]);

  const saveProfile=async(e)=>{e.preventDefault();setSaving(true);try{const r=await adminApi.patch('/ops/me/profile',{name:profile.name,email:profile.email,phone:profile.phone});const next=r.data?.data||profile;setProfile(next);const stored=JSON.parse(localStorage.getItem('adminData')||'{}');localStorage.setItem('adminData',JSON.stringify({...stored,...next}));await Swal.fire({icon:'success',title:'Profile updated',text:r.data?.message||'Your administrator profile has been updated.',confirmButtonColor:'#2E3192'})}catch(err){Swal.fire('Not saved',err?.response?.data?.message||err.message,'error')}finally{setSaving(false)}};

  const changePassword=async(e)=>{e.preventDefault();if(password.newPassword!==password.confirmPassword)return Swal.fire('Passwords do not match','Confirm the new password and try again.','warning');setSaving(true);try{const r=await adminApi.patch('/ops/me/password',{currentPassword:password.currentPassword,newPassword:password.newPassword});setPassword({currentPassword:'',newPassword:'',confirmPassword:''});await Swal.fire({icon:'success',title:'Password changed',text:r.data?.message||'Password changed successfully.',confirmButtonColor:'#2E3192'});localStorage.removeItem('adminToken');localStorage.removeItem('adminData');window.location.href='/admin/login'}catch(err){Swal.fire('Password not changed',err?.response?.data?.message||err.message,'error')}finally{setSaving(false)}};

  if(loading)return <div className="rounded-3xl border bg-white p-12 text-center text-slate-500">Loading administrator settings…</div>;
  const initials=(profile.name||profile.email||'A').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();

  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#2E3192]/60">Account Security</p><h1 className="mt-2 text-3xl font-black text-[#1c2454]">Admin Settings</h1><p className="mt-2 text-sm text-slate-500">Manage your administrator profile and sign-in password.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <motion.form onSubmit={saveProfile} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2E3192] text-xl font-black text-white">{initials}</div><div><h2 className="text-xl font-black text-[#1c2454]">Profile</h2><p className="text-sm text-slate-500">Role: <span className="font-semibold capitalize">{String(profile.role||'admin').replace('_',' ')}</span></p></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" icon={User} value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})}/><Field disabled={!can("access.manage")} label="Email address" icon={Mail} type="email" required value={profile.email||''} onChange={e=>setProfile({...profile,email:e.target.value})}/><div className="sm:col-span-2"><Field label="Phone number" icon={Phone} value={profile.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div></div>
        <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2E3192] px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={17}/>{saving?'Saving…':'Save Profile'}</button>
      </motion.form>
      <motion.form onSubmit={changePassword} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><ShieldCheck size={20}/></div><div><h2 className="font-black text-[#1c2454]">Change Password</h2><p className="text-xs text-slate-500">You will be signed out after a successful change.</p></div></div>
        <div className="space-y-4"><Field label="Current password" icon={Lock} type="password" required value={password.currentPassword} onChange={e=>setPassword({...password,currentPassword:e.target.value})}/><Field label="New password" icon={Lock} type="password" minLength={10} required value={password.newPassword} onChange={e=>setPassword({...password,newPassword:e.target.value})}/><Field label="Confirm new password" icon={Lock} type="password" minLength={10} required value={password.confirmPassword} onChange={e=>setPassword({...password,confirmPassword:e.target.value})}/></div>
        <button disabled={saving} className="mt-6 w-full rounded-xl border border-[#2E3192] px-5 py-3 font-bold text-[#2E3192] transition hover:bg-[#2E3192] hover:text-white disabled:opacity-60">Update Password</button>
      </motion.form>
    </div>
  </div>;
};
export default AdminSettings;
