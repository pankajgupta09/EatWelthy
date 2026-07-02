import { create } from "zustand";
import api from "@/lib/axios";
import type { Profile } from "@/types";
import toast from "react-hot-toast";

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  getProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  generateDiet: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  loading: false,

  getProfile: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<Profile>("/api/profile/me");
      set({ profile: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put<Profile>("/api/profile", profileData);
      set({ profile: data });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  },

  changePassword: async (password) => {
    try {
      await api.put("/api/profile/updatepassword", { password });
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.[0]?.msg || "Failed to update password");
    }
  },

  deleteAccount: async () => {
    try {
      await api.delete("/api/profile");
    } catch {
      toast.error("Failed to delete account");
    }
  },

  generateDiet: async () => {
    try {
      const { data } = await api.post<Profile>("/api/profile/generate-diet");
      set({ profile: data });
      toast.success("Diet plan generated!");
    } catch {
      toast.error("Failed to generate diet plan");
    }
  },
}));
