import axios from "axios";
import Swal from "sweetalert2";

let authAlertShown = false;
let isRefreshing = false;
let refreshQueue = [];

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

    if (status === 401 && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post("/api/auth/refresh", { refreshToken });

        const newToken = res.data?.token;
        const newRefresh = res.data?.refreshToken;

        if (newToken) localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
        if(res.data?.user) { localStorage.setItem("authUser",JSON.stringify(res.data.user)); window.dispatchEvent(new CustomEvent("account-updated",{detail:res.data.user})); }

        refreshQueue.forEach((p) => p.resolve(newToken));
        refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        refreshQueue.forEach((p) => p.reject(err));
        refreshQueue = [];
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (window.location.pathname !== "/login") {
          window.location.href = window.location.pathname.startsWith("/buyer") ? "/buyer/login" : "/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
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
          window.location.href = window.location.pathname.startsWith("/buyer") ? "/buyer/login" : "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
