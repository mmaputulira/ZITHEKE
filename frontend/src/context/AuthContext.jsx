import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import api from "../api/axios.js";
import { disconnectSocket } from "../socket.js";
export const AuthContext = createContext();
export const AuthProvider = ({children}) => {
  const [user,setState] = useState(null), [loading,setLoading] = useState(true);
  const setUser = useCallback(value => { setState(value); if(value)localStorage.setItem("authUser",JSON.stringify(value));else { localStorage.removeItem("authUser"); disconnectSocket(); } },[]);
  const refreshAccount = useCallback(async () => {
    if(!localStorage.getItem("token")) { setUser(null); return null; }
    try { const {data}=await api.get("/auth/me");setUser(data.user);return data.user; }
    catch(error) { if([401,403].includes(error.response?.status)){setUser(null);localStorage.removeItem("token");localStorage.removeItem("refreshToken");} throw error; }
  },[setUser]);
  useEffect(()=>{ let mounted=true; refreshAccount().catch(()=>{}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false} },[refreshAccount]);
  useEffect(()=>{const onFocus=()=>refreshAccount().catch(()=>{});const update=e=>{if(e.detail)setUser(e.detail)};window.addEventListener("focus",onFocus);window.addEventListener("account-updated",update);return()=>{window.removeEventListener("focus",onFocus);window.removeEventListener("account-updated",update)}},[refreshAccount,setUser]);
  const logout = async () => { try { await api.post("/auth/logout",{refreshToken:localStorage.getItem("refreshToken")}); } catch {} try {if(auth.currentUser)await signOut(auth);} finally { for(const key of ["token","refreshToken","authUser"])localStorage.removeItem(key);setUser(null); } };
  return <AuthContext.Provider value={{user,setUser,loading,logout,refreshAccount}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>useContext(AuthContext);
