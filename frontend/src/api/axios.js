import axios from "axios";
import Swal from "sweetalert2";

let authAlertShown = false;
let refreshPromise = null;

// A bare client with no interceptors, so a failed refresh can never loop.
const authClient = axios.create();

const signInPath = () =>
  window.location.pathname.startsWith("/buyer") ? "/buyer/login" : "/login";

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
};

/**
 * Exchanges the refresh token for a new access token. Concurrent callers
 * share one request. Resolves with the new token, rejects when the session
 * can no longer be renewed.
 */
export const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return Promise.reject(new Error("No refresh token"));

  refreshPromise = authClient
    .post("/api/auth/refresh", { refreshToken })
    .then((res) => {
      const newToken = res.data?.token;
      if (!newToken) throw new Error("Refresh returned no token");
      localStorage.setItem("token", newToken);
      if (res.data?.refreshToken) localStorage.setItem("refreshToken", res.data.refreshToken);
      if (res.data?.user) {
        localStorage.setItem("authUser", JSON.stringify(res.data.user));
        window.dispatchEvent(new CustomEvent("account-updated", { detail: res.data.user }));
      }
      window.dispatchEvent(new CustomEvent("token-refreshed", { detail: newToken }));
      return newToken;
    })
    .catch((err) => {
      if ([400, 401, 403].includes(err.response?.status)) {
        clearSession();
        if (window.location.pathname !== signInPath()) window.location.href = signInPath();
      }
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const isAuthEndpoint = (url = "") => /\/auth\/(refresh|login|signup|logout)/.test(url);

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* REQUEST INTERCEPTOR */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Let browser set multipart boundary for FormData uploads.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* RESPONSE INTERCEPTOR */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      if (!localStorage.getItem("refreshToken")) return Promise.reject(error);
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    if (status === 403) {
      const message = String(
        error.response?.data?.message || "You do not have permission to do that."
      );
      const accountBlocked = /suspended|inactive|account unavailable/i.test(message);

      if (!authAlertShown) {
        authAlertShown = true;
        Swal.fire({
          icon: accountBlocked ? "warning" : "info",
          title: accountBlocked ? "Account unavailable" : "Action not available",
          text: message,
          toast: true,
          position: "top",
          timer: 2600,
          showConfirmButton: false,
          timerProgressBar: true,
        });
        setTimeout(() => {
          authAlertShown = false;
        }, 3000);
      }

      // A normal forbidden action must not sign the customer out. Only an
      // account-level block invalidates the local session immediately.
      if (accountBlocked) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("authUser");
        if (window.location.pathname !== "/login") {
          window.location.href = signInPath();
        }
      }
    }

    return Promise.reject(error);
  }
);

/*
 * Many screens call the plain axios client with a token they read once from
 * localStorage. Access tokens last 15 minutes, so those calls started failing
 * with 401 once a page had been open a while (chat stopped loading and
 * sending). Give plain axios the same fresh-token and refresh-on-401 handling
 * for our own /api requests.
 */
const isOwnApi = (url = "") => url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && isOwnApi(config.url) && !isAuthEndpoint(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      isOwnApi(original.url) &&
      !isAuthEndpoint(original.url) &&
      localStorage.getItem("refreshToken")
    ) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return axios(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
