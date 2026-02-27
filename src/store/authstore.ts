import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { api } from "@/lib/api";
import { disconnectSocket } from '@/sockets/socket';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  sessionExpiredAt: number | null;
  setUser: (user: User) => void;
  logout: () => void;
  handleSessionExpiry: (reason?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  initCrossTabSync: () => () => void;
}

// BroadcastChannel for cross-tab logout synchronization
const LOGOUT_CHANNEL_NAME = 'carexpert-logout';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      sessionExpiredAt: null,

      setUser: (user) => set({ user, sessionExpiredAt: null }),

      handleSessionExpiry: (reason?: string) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({ user: null, sessionExpiredAt: Date.now() });
        disconnectSocket();
        localStorage.removeItem('auth-storage');

        try {
          const channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
          channel.postMessage({ type: 'logout', reason: reason || 'session_expired' });
          channel.close();
        } catch {
          localStorage.setItem('carexpert-logout-event', Date.now().toString());
          localStorage.removeItem('carexpert-logout-event');
        }
      },

      logout: () => {
        get().handleSessionExpiry('user_logout');
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, sessionExpiredAt: null });
        try {
          const res = await api.post("/user/login", {
            data: email,
            password,
          });

          if (res.data.success) {
            const userData: User = {
              id: res.data.data.id,
              name: res.data.data.name,
              email: res.data.data.email,
              profilePicture: res.data.data.profilePicture,
              role: res.data.data.role,
            };
            set({ user: userData, isLoading: false, sessionExpiredAt: null });
            return;
          }
          throw new Error("Login failed");
        } catch (err) {
          set({ isLoading: false });
          if (axios.isAxiosError(err) && err.response) {
            throw new Error(err.response.data?.message || "Login failed");
          }
          throw new Error("Unknown error occurred");
        }
      },

      checkAuth: async () => {
        // With Zustand persist, the user is already rehydrated from localStorage synchronously.
        // We just mark loading as complete. If a backend check is needed later, add API call here.
        set({ isLoading: false });
      },

      initCrossTabSync: () => {
        let channel: BroadcastChannel | null = null;

        // Primary: BroadcastChannel for cross-tab sync
        try {
          channel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
          channel.onmessage = (event) => {
            if (event.data?.type === 'logout') {
              const currentUser = get().user;
              if (currentUser) {
                set({ user: null, sessionExpiredAt: Date.now() });
                disconnectSocket();
                localStorage.removeItem('auth-storage');
                // Redirect to login
                window.location.href = '/auth/login';
              }
            }
          };
        } catch {
          // BroadcastChannel not supported, fallback below
        }

        // Fallback: storage event for older browsers
        const handleStorageEvent = (event: StorageEvent) => {
          if (event.key === 'carexpert-logout-event') {
            const currentUser = get().user;
            if (currentUser) {
              set({ user: null, sessionExpiredAt: Date.now() });
              disconnectSocket();
              localStorage.removeItem('auth-storage');
              window.location.href = '/auth/login';
            }
          }
          // Also detect if auth-storage was removed externally
          if (event.key === 'auth-storage' && event.newValue === null) {
            const currentUser = get().user;
            if (currentUser) {
              set({ user: null, sessionExpiredAt: Date.now() });
              disconnectSocket();
              window.location.href = '/auth/login';
            }
          }
        };
        window.addEventListener('storage', handleStorageEvent);

        // Return cleanup function
        return () => {
          channel?.close();
          window.removeEventListener('storage', handleStorageEvent);
        };
      },
    }),
    {
      name: "auth-storage",
      // Persist only non-sensitive profile information. Do NOT persist tokens.
      partialize: (state) => {
        const u = state.user;
        if (!u) return { user: null };
        return {
          user: {
            id: u.id,
            name: u.name,
            email: u.email,
            profilePicture: u.profilePicture,
            role: u.role,
          },
        };
      },
    },
  ),
);
