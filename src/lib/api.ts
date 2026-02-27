// src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "@/store/authstore";
import { notify } from "@/lib/toast";

// Normalize base URL to ensure it always targets the /api path
const rawBaseUrl =
  (import.meta.env.VITE_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "";
const baseURL = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true, // This ensures cookies/sessions are always sent
});

// Flag to prevent multiple simultaneous 401 handlers
let isHandlingUnauthorized = false;

// Interceptor to handle global responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

    // If the backend returns 401 Unauthorized, the session expired
    if (status === 401) {
      // Deduplicate: only handle the first 401 in a batch
      if (!isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        notify.error("Session expired. Please log in again.");
        useAuthStore.getState().logout();
        window.location.href = "/auth/login";
        // Reset flag after a short delay to absorb rapid-fire 401s
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 2000);
      }
      return Promise.reject(error);
    }

    if (status >= 400) {
      notify.error(message);
    }

    return Promise.reject(error);
  }
);