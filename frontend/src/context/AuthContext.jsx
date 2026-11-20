import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import api from "../api/axios.js";
import { disconnectSocket } from "../socket.js";

export const AuthContext = createContext();

// One account can shop and sell. "mode" is only which side of the app the
// person is using right now (Customer or Seller). It lives on this device.
const MODE_KEY = "zitheke.viewMode";
const PICK_KEY = "zitheke.pickMode";
const readStored = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const writeStored = (storage, key, value) => { try { value == null ? storage.removeItem(key) : storage.setItem(key, value); } catch { /* storage blocked */ } };

export const homeForMode = (mode) => (mode === "seller" ? "/dashboard" : "/buyer/account");

export const AuthProvider = ({children}) => {
  const [user,setState] = useState(null), [loading,setLoading] = useState(true);
  const [storedMode,setStoredMode] = useState(() => readStored(localStorage, MODE_KEY));
  const [pickingMode,setPickingMode] = useState(() => readStored(sessionStorage, PICK_KEY) === "1");

  const setUser = useCallback(value => { setState(value); if(value)localStorage.setItem("authUser",JSON.stringify(value));else { localStorage.removeItem("authUser"); disconnectSocket(); } },[]);
  const refreshAccount = useCallback(async () => {
    if(!localStorage.getItem("token")) { setUser(null); return null; }
    try { const {data}=await api.get("/auth/me");setUser(data.user);return data.user; }
    catch(error) { if([401,403].includes(error.response?.status)){setUser(null);localStorage.removeItem("token");localStorage.removeItem("refreshToken");} throw error; }
  },[setUser]);
  useEffect(()=>{ let mounted=true; refreshAccount().catch(()=>{}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false} },[refreshAccount]);
  useEffect(()=>{const onFocus=()=>refreshAccount().catch(()=>{});const update=e=>{if(e.detail)setUser(e.detail)};window.addEventListener("focus",onFocus);window.addEventListener("account-updated",update);return()=>{window.removeEventListener("focus",onFocus);window.removeEventListener("account-updated",update)}},[refreshAccount,setUser]);

  // Seller mode needs selling switched on. Otherwise fall back to Customer.
  const mode = useMemo(() => {
    if (!user) return "buyer";
    const wanted = storedMode === "seller" || storedMode === "buyer" ? storedMode : (user.canSell ? "seller" : "buyer");
    return wanted === "seller" && !user.canSell ? "buyer" : wanted;
  }, [user, storedMode]);

  const setMode = useCallback(next => { const value = next === "seller" ? "seller" : "buyer"; writeStored(localStorage, MODE_KEY, value); setStoredMode(value); }, []);

  // Login and signup call this so the Customer / Seller picker shows once.
  const requestModeChoice = useCallback(() => { writeStored(sessionStorage, PICK_KEY, "1"); setPickingMode(true); }, []);
  const finishModeChoice = useCallback(() => { writeStored(sessionStorage, PICK_KEY, null); setPickingMode(false); }, []);

  const startSelling = useCallback(async (businessName = "") => {
    const { data } = await api.post("/auth/start-selling", { businessName });
    if (data?.user) setUser(data.user);
    return data?.user;
  }, [setUser]);

  const logout = async () => { try { await api.post("/auth/logout",{refreshToken:localStorage.getItem("refreshToken")}); } catch {} try {if(auth.currentUser)await signOut(auth);} finally { for(const key of ["token","refreshToken","authUser"])localStorage.removeItem(key);finishModeChoice();setUser(null); } };
  return <AuthContext.Provider value={{user,setUser,loading,logout,refreshAccount,mode,setMode,pickingMode,requestModeChoice,finishModeChoice,startSelling}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>useContext(AuthContext);
