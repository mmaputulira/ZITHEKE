import { io } from "socket.io-client";
import api from "./api/axios.js";

const SOCKET_URL = window.location.origin;
let socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  auth: callback => callback({ token: localStorage.getItem("token") }),
});

export const connectSocket = (uid) => {
  if (!uid) return socket;
  if (socket.connected) return socket;

  if (!localStorage.getItem("token")) return socket;
  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  socket.disconnect();
};

let refreshing = false;
socket.on("connect_error", async error => {
  if (error.message !== "Unauthorized socket" || refreshing || !localStorage.getItem("refreshToken")) return;
  refreshing = true;
  try {
    await api.get("/auth/me");
    if (localStorage.getItem("token")) socket.connect();
  } catch { socket.disconnect(); }
  finally { refreshing = false; }
});

export default socket;
