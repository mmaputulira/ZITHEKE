import React,{createContext,useContext,useEffect,useState} from "react";
import {Navigate} from "react-router-dom";
import adminApi from "../api/adminApi.js";
import policy from "../adminAccess.json";
import RequiredPasswordChange from './RequiredPasswordChange.jsx';
const Context=createContext({admin:null,can:()=>false});
export const useAdminAccess=()=>useContext(Context);
export function AdminAccessProvider({children}){
 const[admin,setAdmin]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{try{const{data}=await adminApi.get('/ops/me/profile');if(active){setAdmin(data.data);setError('');localStorage.setItem('adminData',JSON.stringify(data.data))}}catch(e){if(active){setAdmin(null);setError(e.response?.data?.message||'Unable to confirm staff permissions.')}}finally{if(active)setLoading(false)}};
  refresh();window.addEventListener('focus',refresh);window.addEventListener('admin-access-updated',refresh);const timer=setInterval(refresh,60000);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('admin-access-updated',refresh)};
 },[]);
 if(loading)return <div className="p-8 text-[#2E3192]">Checking staff access…</div>;
 if(error)return <div className="p-8"><p role="alert">{error}</p><a href="/admin/login" className="text-[#2E3192] underline">Return to staff login</a></div>;
 if(admin?.mustChangePassword)return <RequiredPasswordChange admin={admin}/>;
 const can=permission=>Array.isArray(admin?.permissions)&&admin.permissions.includes(permission);
 return <Context.Provider value={{admin,can,labels:policy.labels}}>{children}</Context.Provider>;
}
export function AdminPageGuard({page,children}){
 const{can}=useAdminAccess();const permission=policy.pages[page];
 if(page===''&&!can(permission)){const next=Object.entries(policy.pages).find(([path,access])=>path&&can(access));if(next)return <Navigate to={`/admin/${next[0]}`} replace/>;}
 return permission&&can(permission)?children:<div className="rounded-2xl border bg-white p-8"><h1 className="text-2xl font-bold text-[#2E3192]">Access restricted</h1><p className="mt-3 text-slate-600">Your assigned staff roles do not provide access to this page. Choose an available page from the menu.</p></div>;
}
