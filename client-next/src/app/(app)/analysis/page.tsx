"use client";

import { useEffect } from "react";
import { Loader2, BarChart2, Droplets, Moon, Apple, Dumbbell, Clock, Flame, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useProfileStore } from "@/store/profileStore";
import type { DietMeal, Profile } from "@/types";

// ─── Health Calculations ──────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calcBMI(weight: number, height: number) {
  if (!weight || !height) return null;
  return weight / Math.pow(height / 100, 2);
}

function bmiCategory(bmi: number): { label: string; color: string; bg: string; bar: string; pct: number } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600", bg: "bg-blue-50", bar: "bg-blue-400", pct: Math.min((bmi / 18.5) * 25, 25) };
  if (bmi < 25)   return { label: "Normal",      color: "text-green-600", bg: "bg-green-50", bar: "bg-green-500", pct: 25 + ((bmi - 18.5) / 6.5) * 25 };
  if (bmi < 30)   return { label: "Overweight",  color: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400", pct: 50 + ((bmi - 25) / 5) * 25 };
  return             { label: "Obese",         color: "text-red-600",   bg: "bg-red-50",   bar: "bg-red-500",   pct: Math.min(75 + ((bmi - 30) / 10) * 25, 100) };
}

function calcBMR(weight: number, height: number, age: number, gender: string) {
  if (!weight || !height || !age) return null;
  if (gender === "female") return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age + 5; // male / other
}

function calcTDEE(bmr: number, activityLevel: string) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2));
}

function calcTargetCalories(tdee: number, dietPlan: string) {
  if (dietPlan === "weight_loss")  return tdee - 500;
  if (dietPlan === "weight_gain")  return tdee + 500;
  if (dietPlan === "muscle_gain")  return tdee + 300;
  return tdee;
}

function calcProtein(weight: number, dietPlan: string) {
  if (!weight) return null;
  if (dietPlan === "muscle_gain") return { min: Math.round(weight * 1.6), max: Math.round(weight * 2.2) };
  if (dietPlan === "weight_loss") return { min: Math.round(weight * 1.2), max: Math.round(weight * 1.6) };
  return { min: Math.round(weight * 0.8), max: Math.round(weight * 1.2) };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, unit, sub, icon: Icon, iconColor, iconBg }: {
  label: string; value: string | number; unit?: string; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function BMICard({ weight, height }: { weight: number; height: number }) {
  const bmi = calcBMI(weight, height);

  if (!bmi) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm col-span-2">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">BMI</p>
        <p className="text-slate-400 text-sm">Set your weight and height in Profile to see BMI.</p>
      </div>
    );
  }

  const cat = bmiCategory(bmi);

  return (
    <div className={`rounded-2xl border p-5 shadow-sm col-span-2 ${cat.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Body Mass Index (BMI)</p>
          <p className="text-3xl font-bold text-slate-900">{bmi.toFixed(1)}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/70 ${cat.color}`}>
          {cat.label}
        </span>
      </div>

      {/* BMI scale bar */}
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-blue-300 via-green-400 via-amber-400 to-red-500 mb-2">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md bg-slate-800 transition-all"
          style={{ left: `calc(${Math.min(Math.max(cat.pct, 2), 98)}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Under&shy;weight</span>
        <span>Normal</span>
        <span>Over&shy;weight</span>
        <span>Obese</span>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Healthy BMI range: <span className="font-semibold text-slate-700">18.5 – 24.9</span>
      </p>
    </div>
  );
}

function WeightGoalCard({ weight, targetWeight, dietPlan }: { weight: number; targetWeight: number; dietPlan: string }) {
  if (!weight || !targetWeight) return null;
  const diff = weight - targetWeight;
  const abs = Math.abs(diff);

  const Icon = diff === 0 ? Minus : diff > 0 ? TrendingDown : TrendingUp;
  const color = diff === 0 ? "text-green-600" : diff > 0 ? "text-amber-600" : "text-blue-600";
  const bg = diff === 0 ? "bg-green-50" : diff > 0 ? "bg-amber-50" : "bg-blue-50";
  const label = diff === 0 ? "At target weight!" : diff > 0 ? `${abs.toFixed(1)} kg to lose` : `${abs.toFixed(1)} kg to gain`;
  const sub = diff === 0 ? "Keep it up." : diff > 0 ? `Goal: ${targetWeight} kg` : `Goal: ${targetWeight} kg`;

  return (
    <div className={`rounded-2xl border border-transparent p-5 shadow-sm ${bg}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/70 mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Weight Goal</p>
      <p className={`text-xl font-bold ${color}`}>{label}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function HealthStatsSection({ profile }: { profile: Profile }) {
  const { weight = 0, height = 0, age = 0, gender = "male", activityLevel = "sedentary", dietPlan = "maintenance", targetWeight = 0 } = profile;

  const bmr = calcBMR(weight, height, age, gender);
  const tdee = bmr ? calcTDEE(bmr, activityLevel) : null;
  const targetCal = tdee ? calcTargetCalories(tdee, dietPlan) : null;
  const protein = calcProtein(weight, dietPlan);

  const hasData = weight > 0 && height > 0;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-800">Health Stats</h2>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
          Complete your <strong>weight</strong> and <strong>height</strong> in Profile Settings to unlock all stats.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* BMI spans 2 cols */}
        <BMICard weight={weight} height={height} />

        {bmr && (
          <StatCard
            label="BMR"
            value={Math.round(bmr)}
            unit="kcal/day"
            sub="Calories your body burns at rest"
            icon={Flame}
            iconColor="text-orange-500"
            iconBg="bg-orange-50"
          />
        )}

        {tdee && (
          <StatCard
            label="TDEE"
            value={tdee}
            unit="kcal/day"
            sub="Total daily energy expenditure"
            icon={Dumbbell}
            iconColor="text-purple-500"
            iconBg="bg-purple-50"
          />
        )}

        {targetCal && (
          <StatCard
            label="Daily Target"
            value={targetCal}
            unit="kcal"
            sub={dietPlan.replace("_", " ") + " goal"}
            icon={Target}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        )}

        {protein && (
          <StatCard
            label="Protein Target"
            value={`${protein.min}–${protein.max}`}
            unit="g/day"
            sub="Based on your goal"
            icon={Apple}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />
        )}

        {weight > 0 && targetWeight > 0 && (
          <WeightGoalCard weight={weight} targetWeight={targetWeight} dietPlan={dietPlan} />
        )}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  Breakfast: { border: "border-amber-200", bg: "bg-amber-50", dot: "bg-amber-400" },
  Lunch:     { border: "border-green-200", bg: "bg-green-50", dot: "bg-green-400" },
  Snack:     { border: "border-blue-200",  bg: "bg-blue-50",  dot: "bg-blue-400"  },
  Dinner:    { border: "border-purple-200",bg: "bg-purple-50",dot: "bg-purple-400"},
};

const TIPS = [
  { icon: Droplets, color: "text-blue-500 bg-blue-50",   title: "Stay Hydrated",      desc: "Aim for 8 glasses (2 litres) of water per day. Hydration supports metabolism, digestion, and energy levels." },
  { icon: Moon,     color: "text-purple-500 bg-purple-50",title: "Prioritise Sleep",   desc: "7–9 hours of sleep helps regulate hunger hormones like ghrelin and leptin, reducing overeating." },
  { icon: Apple,    color: "text-green-500 bg-green-50",  title: "Eat Whole Foods",    desc: "Minimise processed foods. Whole grains, vegetables, legumes, and lean proteins should anchor every meal." },
  { icon: Dumbbell, color: "text-red-500 bg-red-50",      title: "Move Daily",         desc: "Even 30 minutes of moderate activity — walking, cycling, yoga — significantly improves metabolic health." },
  { icon: Clock,    color: "text-amber-500 bg-amber-50",  title: "Consistent Meal Times", desc: "Eating at regular intervals keeps your blood sugar stable and reduces energy crashes throughout the day." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { profile, loading, getProfile, generateDiet } = useProfileStore();

  useEffect(() => {
    getProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your health stats, diet plan, and nutrition insights.</p>
        </div>
        {profile?.dietSuggestions && profile.dietSuggestions.length > 0 && (
          <button
            onClick={generateDiet}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Regenerate Plan
          </button>
        )}
      </div>

      {/* Health Stats */}
      {profile ? (
        <HealthStatsSection profile={profile} />
      ) : (
        <div className="flex justify-center py-8">
          <Loader2 className="w-7 h-7 animate-spin text-green-500" />
        </div>
      )}

      {/* Diet Plan */}
      {profile && (
        profile.dietSuggestions && profile.dietSuggestions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-5">Your Personalised Meal Plan</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.dietSuggestions.map((meal: DietMeal) => {
                const colors = MEAL_COLORS[meal.meal] ?? { border: "border-slate-200", bg: "bg-slate-50", dot: "bg-slate-400" };
                return (
                  <div key={meal.meal} className={`rounded-xl border p-5 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      <h3 className="font-semibold text-slate-800">{meal.meal}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {meal.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">{item.food}</span>
                          <span className="text-slate-400 text-xs self-center ml-2 shrink-0">{item.weight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {profile.lastDietSuggestionUpdate && (
              <p className="text-xs text-slate-400 mt-4">
                Last updated: {new Date(profile.lastDietSuggestionUpdate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">No Diet Plan Yet</h3>
            <p className="text-slate-500 text-sm mb-5">
              Fill in your profile metrics first, then generate a personalised meal plan.
            </p>
            <button
              onClick={generateDiet}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Diet Plan
            </button>
          </div>
        )
      )}

      {/* Nutrition Tips */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Nutrition Tips</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIPS.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl bg-slate-50">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
