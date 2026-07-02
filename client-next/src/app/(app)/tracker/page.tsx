"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Pencil, Trash2, Coffee, Sun, Moon, Apple,
  Flame, Dumbbell, Droplets, Wheat, Plus, Search,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useNutritionStore } from "@/store/nutritionStore";
import type { Food } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealRow {
  _id: string;
  meal_type: MealType;
  food_taken: string;
  portion: number;
  time: string;
  energy?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

// ─── Schemas ────────────────────────────────────────────────────────────────────

const mealLogSchema = z.object({
  time: z.string().min(1, "Required"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food_taken: z.string().min(1, "Required"),
  portion: z.number().positive("Must be positive"),
});

const foodSchema = z.object({
  name: z.string().min(1, "Required"),
  energy: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  sugar: z.number().min(0),
  fiber: z.number().min(0),
  sodium: z.number().min(0),
  vitamin_c: z.number().min(0),
  calcium: z.number().min(0),
  iron: z.number().min(0),
});

type MealLogData = z.infer<typeof mealLogSchema>;
type FoodData = z.infer<typeof foodSchema>;

// ─── Tabs ────────────────────────────────────────────────────────────────────────

const TABS = ["Log Meal", "Recent Meals", "Food Database", "Add Custom Food"] as const;
type Tab = (typeof TABS)[number];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors";
const labelCls = "block text-sm font-medium text-slate-600 mb-1";
const btnPrimary =
  "bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2";

const MEAL_GUIDE = [
  {
    type: "breakfast",
    icon: Coffee,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    time: "7:00 – 9:00 AM",
    desc: "Start with protein + complex carbs. E.g. eggs, oats, fruit.",
  },
  {
    type: "lunch",
    icon: Sun,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    time: "12:00 – 2:00 PM",
    desc: "Balanced plate: lean protein, veggies, whole grains.",
  },
  {
    type: "dinner",
    icon: Moon,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-100",
    time: "7:00 – 9:00 PM",
    desc: "Keep it lighter. Focus on protein + greens, less carbs.",
  },
  {
    type: "snack",
    icon: Apple,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-100",
    time: "Between meals",
    desc: "Nuts, yogurt, fruit, or a protein bar.",
  },
];

// ─── Log Meal Tab ────────────────────────────────────────────────────────────────

function LogMealTab({ userId, onMealLogged }: { userId: string; onMealLogged: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MealLogData>({ resolver: zodResolver(mealLogSchema) });

  const onSubmit = async (data: MealLogData) => {
    try {
      await api.post("/nutrition/log_meal", {
        owner: userId,
        meal_type: data.meal_type,
        food_taken: data.food_taken,
        portion: data.portion / 100,
        time: new Date(data.time).toISOString(),
      });
      toast.success("Meal logged!");
      reset();
      onMealLogged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { msg?: string } } };
      toast.error(e.response?.data?.msg ?? "Failed to log meal");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Log a meal</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls} htmlFor="time">Date &amp; Time</label>
              <input id="time" type="datetime-local" {...register("time")} className={inputCls} />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="meal_type">Meal Type</label>
              <select id="meal_type" {...register("meal_type")} className={inputCls}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="portion">Portion (g)</label>
              <input
                id="portion"
                type="number"
                step="1"
                placeholder="100"
                {...register("portion", { valueAsNumber: true })}
                className={inputCls}
              />
              {errors.portion && <p className="text-red-500 text-xs mt-1">{errors.portion.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls} htmlFor="food_taken">Food name</label>
              <input
                id="food_taken"
                type="text"
                placeholder="e.g. Chicken breast, Brown rice, Banana"
                {...register("food_taken")}
                className={inputCls}
              />
              {errors.food_taken && (
                <p className="text-red-500 text-xs mt-1">{errors.food_taken.message}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Use common English food names for best nutrition lookup accuracy.
              </p>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSubmitting ? "Logging…" : "Log Meal"}
          </button>
        </form>
      </div>

      {/* Guide */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Meal timing guide</h2>
        <div className="space-y-3">
          {MEAL_GUIDE.map(({ type, icon: Icon, color, bg, border, time, desc }) => (
            <div key={type} className={`flex items-start gap-3 p-3 rounded-xl border ${bg} ${border}`}>
              <div className={`mt-0.5 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 capitalize">{type}</span>
                  <span className="text-xs text-slate-400">{time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-1">Portion guide</p>
          <ul className="text-xs text-slate-500 space-y-0.5">
            <li>• Rice / pasta cooked — 150–200 g per serving</li>
            <li>• Chicken / fish — 100–150 g per serving</li>
            <li>• Vegetables — 80–120 g per serving</li>
            <li>• Fruit — 80–100 g per serving</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Nutrient Summary Card ───────────────────────────────────────────────────────

function NutrientSummary({ totals }: { totals: { energy: number; protein: number; fat: number; carbs: number } }) {
  const stats = [
    { label: "Energy", value: totals.energy.toFixed(0), unit: "kcal", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Protein", value: totals.protein.toFixed(1), unit: "g", icon: Dumbbell, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Fat", value: totals.fat.toFixed(1), unit: "g", icon: Droplets, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Carbs", value: totals.carbs.toFixed(1), unit: "g", icon: Wheat, color: "text-green-500", bg: "bg-green-50" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, unit, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
          <Icon className={`w-5 h-5 ${color} shrink-0`} />
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value} <span className="text-xs font-normal text-slate-400">{unit}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Recent Meals Tab ─────────────────────────────────────────────────────────────

function RecentMealsTab({ userId, fetchKey }: { userId: string; fetchKey: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPortion, setEditPortion] = useState("");
  const [editMealType, setEditMealType] = useState<MealType>("breakfast");

  const fetchMeals = async (d: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/nutrition/query_meal", {
        owner: userId,
        meal_type: "",
        time: new Date(d).toISOString(),
      });
      const raw: {
        meal: { _id: string; meal_type: MealType; food_taken: string; portion: number; time: string };
        nutrition: { energy: number; protein: number; fat: number; sugar: number }[];
      }[] = data?.meals ?? [];
      const rows: MealRow[] = raw.map(({ meal, nutrition }) => {
        const n = nutrition?.[0];
        const p = meal.portion;
        return {
          _id: meal._id,
          meal_type: meal.meal_type,
          food_taken: meal.food_taken,
          portion: meal.portion,
          time: meal.time,
          energy: n ? +(n.energy * p).toFixed(1) : undefined,
          protein: n ? +(n.protein * p).toFixed(1) : undefined,
          fat: n ? +(n.fat * p).toFixed(1) : undefined,
          carbs: n ? +(n.sugar * p).toFixed(1) : undefined,
        };
      });
      setMeals(rows);
      setFetched(true);
    } catch {
      toast.error("Failed to fetch meals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchMeals(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchKey]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/nutrition/meal_delete/${id}`);
      setMeals((prev) => prev.filter((m) => m._id !== id));
      toast.success("Meal deleted");
    } catch {
      toast.error("Failed to delete meal");
    }
  };

  const handleEdit = async (id: string) => {
    const portion = parseFloat(editPortion);
    if (isNaN(portion) || portion <= 0) { toast.error("Enter a valid portion"); return; }
    try {
      await api.put(`/nutrition/meal_update/${id}`, { owner: userId, portion: portion / 100, meal_type: editMealType });
      setMeals((prev) => prev.map((m) => (m._id === id ? { ...m, portion: portion / 100, meal_type: editMealType } : m)));
      toast.success("Meal updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update meal");
    }
  };

  const totals = meals.reduce(
    (acc, m) => ({ energy: acc.energy + (m.energy ?? 0), protein: acc.protein + (m.protein ?? 0), fat: acc.fat + (m.fat ?? 0), carbs: acc.carbs + (m.carbs ?? 0) }),
    { energy: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Date picker row */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className={labelCls} htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls + " w-auto"}
          />
        </div>
        <button onClick={() => fetchMeals(date)} disabled={loading} className={btnPrimary}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Loading…" : "Fetch Meals"}
        </button>
      </div>

      {/* Nutrient totals */}
      {meals.length > 0 && <NutrientSummary totals={totals} />}

      {/* Empty state */}
      {fetched && meals.length === 0 && !loading && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Apple className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 text-sm">No meals logged for this date.</p>
          <p className="text-slate-400 text-xs mt-1">Go to &quot;Log Meal&quot; to add your first entry.</p>
        </div>
      )}

      {/* Table */}
      {meals.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Food</th>
                <th className="px-4 py-3 text-right">Amount (g)</th>
                <th className="px-4 py-3 text-right">Energy (kcal)</th>
                <th className="px-4 py-3 text-right">Protein (g)</th>
                <th className="px-4 py-3 text-right">Fat (g)</th>
                <th className="px-4 py-3 text-right">Carbs (g)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {meals.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 capitalize">
                    <span className="inline-flex items-center gap-1.5">
                      {m.meal_type === "breakfast" && <Coffee className="w-3.5 h-3.5 text-amber-400" />}
                      {m.meal_type === "lunch" && <Sun className="w-3.5 h-3.5 text-blue-400" />}
                      {m.meal_type === "dinner" && <Moon className="w-3.5 h-3.5 text-purple-400" />}
                      {m.meal_type === "snack" && <Apple className="w-3.5 h-3.5 text-green-400" />}
                      {m.meal_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.food_taken}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === m._id ? (
                      <input
                        type="number"
                        value={editPortion}
                        onChange={(e) => setEditPortion(e.target.value)}
                        className="w-20 px-2 py-1 border border-green-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    ) : (
                      <span className="text-slate-700">{(m.portion * 100).toFixed(0)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.energy?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.protein?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.fat?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{m.carbs?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === m._id ? (
                        <>
                          <button onClick={() => handleEdit(m._id)} className="text-green-600 text-xs font-semibold hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs hover:underline">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(m._id); setEditPortion(String((m.portion * 100).toFixed(0))); setEditMealType(m.meal_type); }}
                            className="text-slate-300 hover:text-green-600 transition-colors" title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(m._id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold text-slate-700 text-sm">
                <td className="px-4 py-3 text-green-700" colSpan={3}>Daily Total</td>
                <td className="px-4 py-3 text-right text-green-700">{totals.energy.toFixed(0)}</td>
                <td className="px-4 py-3 text-right text-green-700">{totals.protein.toFixed(1)}</td>
                <td className="px-4 py-3 text-right text-green-700">{totals.fat.toFixed(1)}</td>
                <td className="px-4 py-3 text-right text-green-700">{totals.carbs.toFixed(1)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Food Database Tab ────────────────────────────────────────────────────────────

function FoodDatabaseTab({ userId }: { userId: string }) {
  const { foods, loading, fetchFoods, deleteFood } = useNutritionStore();
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (userId) fetchFoods(userId).then(() => setFetched(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading && !fetched) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading foods…
      </div>
    );
  }

  if (fetched && foods.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Wheat className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-slate-500 text-sm">No custom foods yet.</p>
        <p className="text-slate-400 text-xs mt-1">Switch to &quot;Add Custom Food&quot; to create your first entry.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-right">Energy</th>
            <th className="px-4 py-3 text-right">Protein</th>
            <th className="px-4 py-3 text-right">Fat</th>
            <th className="px-4 py-3 text-right">Sugar</th>
            <th className="px-4 py-3 text-right">Fiber</th>
            <th className="px-4 py-3 text-right">Sodium</th>
            <th className="px-4 py-3 text-center">Delete</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {foods.map((f: Food) => (
            <tr key={f._id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-800">{f.name}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.energy}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.protein}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.fat}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.sugar}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.fiber}</td>
              <td className="px-4 py-3 text-right text-slate-600">{f.sodium}</td>
              <td className="px-4 py-3 text-center">
                <button onClick={() => deleteFood(f._id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Add Custom Food Tab ──────────────────────────────────────────────────────────

function AddFoodTab({ userId }: { userId: string }) {
  const { addFood } = useNutritionStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FoodData>({ resolver: zodResolver(foodSchema) });

  const onSubmit = async (data: FoodData) => {
    await addFood({ ...data, owner: userId });
    toast.success("Food added!");
    reset();
  };

  const numFields: { id: keyof FoodData; label: string; unit: string }[] = [
    { id: "energy", label: "Energy", unit: "kcal" },
    { id: "protein", label: "Protein", unit: "g" },
    { id: "fat", label: "Fat", unit: "g" },
    { id: "sugar", label: "Sugar", unit: "g" },
    { id: "fiber", label: "Fiber", unit: "g" },
    { id: "sodium", label: "Sodium", unit: "mg" },
    { id: "vitamin_c", label: "Vitamin C", unit: "mg" },
    { id: "calcium", label: "Calcium", unit: "mg" },
    { id: "iron", label: "Iron", unit: "mg" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">Add a custom food</h2>
        <p className="text-xs text-slate-400 mb-5">Values are per 100 g / 100 ml of the food.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="name">Food Name</label>
            <input id="name" type="text" placeholder="e.g. Brown Rice" {...register("name")} className={inputCls} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {numFields.map(({ id, label, unit }) => (
              <div key={id}>
                <label className={labelCls} htmlFor={id}>{label} <span className="text-slate-400 font-normal">({unit})</span></label>
                <input
                  id={id}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...register(id, { valueAsNumber: true })}
                  className={inputCls}
                />
                {errors[id] && <p className="text-red-500 text-xs mt-1">{errors[id]?.message}</p>}
              </div>
            ))}
          </div>

          <button type="submit" disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSubmitting ? "Adding…" : "Add Food"}
          </button>
        </form>
      </div>

      {/* Tips panel */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-4">Why add custom foods?</h2>
        <div className="space-y-3">
          {[
            { title: "Local foods", desc: "Add Indian staples like dal, khichdi, or regional dishes that aren't in standard databases." },
            { title: "Home recipes", desc: "Calculate nutrition for your home-cooked meals by adding the combined recipe." },
            { title: "Branded products", desc: "Add packaged foods using nutrition info from the product label." },
            { title: "Better accuracy", desc: "Your custom foods take priority when logging meals, giving you more precise tracking." },
          ].map(({ title, desc }) => (
            <div key={title} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-xs text-green-700 font-medium">All values are per 100 g or 100 ml</p>
          <p className="text-xs text-green-600 mt-0.5">The portion you enter when logging a meal scales these values automatically.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Log Meal");
  const [recentFetchKey, setRecentFetchKey] = useState(0);
  const { user } = useAuthStore();
  const userId = user?._id ?? "";

  const handleMealLogged = () => {
    setRecentFetchKey((k) => k + 1);
    setActiveTab("Recent Meals");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meal Tracker</h1>
        <p className="text-sm text-slate-500 mt-0.5">Log and review everything you eat.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-white text-green-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {activeTab === "Log Meal" && <LogMealTab userId={userId} onMealLogged={handleMealLogged} />}
        {activeTab === "Recent Meals" && <RecentMealsTab userId={userId} fetchKey={recentFetchKey} />}
        {activeTab === "Food Database" && <FoodDatabaseTab userId={userId} />}
        {activeTab === "Add Custom Food" && <AddFoodTab userId={userId} />}
      </div>
    </div>
  );
}
