"use client";

import { useEffect } from "react";
import { Scale, Target, Wallet, Smile, Activity, Leaf, Dumbbell, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import type { DietMeal } from "@/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  extra_active: "Extra Active",
};

const DIET_PLAN_LABELS: Record<string, string> = {
  maintenance: "Maintenance",
  weight_loss: "Weight Loss",
  weight_gain: "Weight Gain",
  muscle_gain: "Muscle Gain",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { profile, loading, generateDiet } = useProfileStore();

  const stats = [
    {
      label: "Current Weight",
      value: profile ? `${profile.weight} kg` : "—",
      icon: Scale,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Target Weight",
      value: profile ? `${profile.targetWeight} kg` : "—",
      icon: Target,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Daily Budget",
      value: profile ? `₹${profile.dailyBudget}` : "—",
      icon: Wallet,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Profile",
      value: profile?.profileIcon || "🥗",
      icon: Smile,
      color: "bg-purple-50 text-purple-600",
      isEmoji: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s your health snapshot for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, isEmoji }) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              {isEmoji ? (
                <span className="text-xl">{value}</span>
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {isEmoji ? "Icon" : value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Profile Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem icon={<Activity className="w-4 h-4 text-green-600" />} label="Activity" value={ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel} />
            <SummaryItem icon={<Leaf className="w-4 h-4 text-green-600" />} label="Diet Plan" value={DIET_PLAN_LABELS[profile.dietPlan] ?? profile.dietPlan} />
            <SummaryItem icon={<Scale className="w-4 h-4 text-green-600" />} label="Height" value={`${profile.height} cm`} />
            <SummaryItem icon={<Dumbbell className="w-4 h-4 text-green-600" />} label="Age" value={`${profile.age} yrs`} />
          </div>
        </div>
      )}

      {/* Diet Plan */}
      {profile ? (
        profile.dietSuggestions && profile.dietSuggestions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Your Meal Plan</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {profile.dietSuggestions.map((meal: DietMeal) => (
                <MealCard key={meal.meal} meal={meal} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <p className="text-slate-600 text-sm mb-4">
              You don&apos;t have a personalised diet plan yet.
            </p>
            <button
              onClick={generateDiet}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Diet Plan
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: DietMeal }) {
  const mealColors: Record<string, string> = {
    Breakfast: "border-amber-200 bg-amber-50",
    Lunch: "border-green-200 bg-green-50",
    Snack: "border-blue-200 bg-blue-50",
    Dinner: "border-purple-200 bg-purple-50",
  };
  const colorClass = mealColors[meal.meal] ?? "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <h3 className="font-semibold text-slate-800 text-sm mb-2">{meal.meal}</h3>
      <ul className="space-y-1">
        {meal.items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 flex justify-between gap-2">
            <span>{item.food}</span>
            <span className="text-slate-400 shrink-0">{item.weight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
