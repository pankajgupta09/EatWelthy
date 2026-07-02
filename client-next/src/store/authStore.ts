import { create } from "zustand";
import api from "@/lib/axios";
import type { User } from "@/types";
import toast from "react-hot-toast";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  loadUser: async () => {
    try {
      const { data } = await api.get<User>("/users/auth");
      set({ user: data, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post("/users/auth", { email, password });
      // Cookie is set by backend; load user state
      await get().loadUser();
      toast.success("Welcome back!");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || "Login failed";
      toast.error(msg);
      return false;
    }
  },

  register: async (name, email, password) => {
    try {
      await api.post("/users/", { name, email, password });
      toast.success("Account created! Please check your email to verify.");
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || "Registration failed";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await api.delete("/users/auth");
    } catch {}
    set({ user: null, isAuthenticated: false, loading: false });
    toast.success("Logged out");
  },

  verifyEmail: async (email, code) => {
    try {
      await api.post("/users/verify-code", { email, code });
      toast.success("Email verified! You can now log in.");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.errors?.[0]?.msg || "Invalid or expired code";
      toast.error(msg);
      return false;
    }
  },

  resendVerification: async (email) => {
    try {
      await api.post("/users/resend-verification", { email });
      toast.success("Verification code resent");
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.[0]?.msg || "Failed to resend");
    }
  },

  updateName: async (name) => {
    try {
      const { data } = await api.put("/api/profile/update-name", { name });
      set((s) => ({ user: s.user ? { ...s.user, name: data.name } : null }));
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  },

  forgotPassword: async (email) => {
    try {
      await api.post("/users/forgot-password", { email });
      toast.success("If that email exists, a reset link has been sent.");
    } catch {
      // Always show generic message
      toast.success("If that email exists, a reset link has been sent.");
    }
  },

  resetPassword: async (email, token, newPassword) => {
    try {
      await api.post("/users/reset-password", { email, token, newPassword });
      toast.success("Password reset! You can now log in.");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Reset failed");
      return false;
    }
  },
}));
