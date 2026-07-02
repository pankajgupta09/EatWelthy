import { create } from "zustand";
import api from "@/lib/axios";
import type { Food } from "@/types";
import toast from "react-hot-toast";

interface NutritionStore {
  foods: Food[];
  loading: boolean;
  fetchFoods: (userId: string) => Promise<void>;
  addFood: (food: Omit<Food, "_id">) => Promise<void>;
  updateFood: (id: string, food: Partial<Food>, userId: string) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
}

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  foods: [],
  loading: false,

  fetchFoods: async (userId) => {
    set({ loading: true });
    try {
      const { data } = await api.post<{ food_saved: Food[] }>("/nutrition/query_food", { owner: userId });
      set({ foods: data.food_saved || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addFood: async (food) => {
    try {
      const { data } = await api.post<Food>("/nutrition/add", food);
      set((s) => ({ foods: [...s.foods, data] }));
      toast.success("Food added");
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Failed to add food");
    }
  },

  updateFood: async (id, food, userId) => {
    try {
      const { data } = await api.put<Food>(`/nutrition/update/${id}`, { ...food, owner: userId });
      set((s) => ({ foods: s.foods.map((f) => (f._id === id ? data : f)) }));
      toast.success("Food updated");
    } catch {
      toast.error("Failed to update food");
    }
  },

  deleteFood: async (id) => {
    try {
      await api.delete(`/nutrition/delete/${id}`);
      set((s) => ({ foods: s.foods.filter((f) => f._id !== id) }));
      toast.success("Food deleted");
    } catch {
      toast.error("Failed to delete food");
    }
  },
}));
