import { io } from "socket.io-client";
import { refreshAccessToken } from "./api/axios.js";

const SOCKET_URL = window.location.origin;
let manualDisconnect = false;
let renewing = false;
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
  manualDisconnect = false;
  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  manualDisconnect = true;
  socket.disconnect();
};

// Renew the access token, then reconnect. The auth callback above reads the
// new token from localStorage on every (re)connect.
const renewAndReconnect = async () => {
  if (renewing || manualDisconnect || !localStorage.getItem("refreshToken")) return;
  renewing = true;
  try {
    await refreshAccessToken();
    if (!manualDisconnect && localStorage.getItem("token") && !socket.connected) socket.connect();
  } catch {
    socket.disconnect();
  } finally {
    renewing = false;
  }
};

socket.on("connect", () => {
  manualDisconnect = false;
});

// The handshake was refused because the token had expired.
socket.on("connect_error", (error) => {
  if (error?.message === "Unauthorized socket") renewAndReconnect();
});

// The server closes a socket whose token expires mid-session (tokens last 15
// minutes). Socket.IO does not reconnect after a server-side close, so chat
// silently stopped receiving messages. Renew and reconnect instead.
socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") renewAndReconnect();
});

// Keep an open socket on the newest token after any API call refreshes it.
window.addEventListener("token-refreshed", () => {
  if (socket.connected && !manualDisconnect) {
    socket.disconnect();
    socket.connect();
  }
});

export default socket;
