"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const nameSchema = z.object({ name: z.string().min(2, "Name must be at least 2 characters") });
const metricsSchema = z.object({
  age: z.number().int().min(1).max(120),
  height: z.number().min(50).max(300),
  weight: z.number().min(10).max(500),
  targetWeight: z.number().min(10).max(500),
  dailyBudget: z.number().min(0),
});
const dietSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  activityLevel: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]),
  dietPlan: z.enum(["maintenance", "weight_loss", "weight_gain", "muscle_gain"]),
  dietaryPreferences: z.string(),
  allergies: z.string(),
});
const passwordSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type NameData = z.infer<typeof nameSchema>;
type MetricsData = z.infer<typeof metricsSchema>;
type DietData = z.infer<typeof dietSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-800 text-base mb-5">{title}</h2>
      {children}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-red-500 text-xs mt-1">{msg}</p> : null;
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateName, logout } = useAuthStore();
  const { profile, loading, getProfile, updateProfile, changePassword, deleteAccount } = useProfileStore();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-colors";
  const labelCls = "block text-sm font-medium text-slate-600 mb-1";
  const submitBtnCls =
    "bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2";

  // ── Name form ──
  const nameForm = useForm<NameData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  // ── Metrics form ──
  const metricsForm = useForm<MetricsData>({
    resolver: zodResolver(metricsSchema),
    defaultValues: { age: 0, height: 0, weight: 0, targetWeight: 0, dailyBudget: 0 },
  });

  // ── Diet prefs form ──
  const dietForm = useForm<DietData>({
    resolver: zodResolver(dietSchema),
    defaultValues: {
      gender: "male",
      activityLevel: "sedentary",
      dietPlan: "maintenance",
      dietaryPreferences: "",
      allergies: "",
    },
  });

  // ── Password form ──
  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  // Fetch profile on mount if not yet loaded
  useEffect(() => {
    getProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync forms whenever profile data arrives / changes
  useEffect(() => {
    if (!profile) return;
    metricsForm.reset({
      age: profile.age ?? 0,
      height: profile.height ?? 0,
      weight: profile.weight ?? 0,
      targetWeight: profile.targetWeight ?? 0,
      dailyBudget: profile.dailyBudget ?? 0,
    });
    dietForm.reset({
      gender: profile.gender ?? "male",
      activityLevel: profile.activityLevel ?? "sedentary",
      dietPlan: profile.dietPlan ?? "maintenance",
      dietaryPreferences: profile.dietaryPreferences ?? "",
      allergies: Array.isArray(profile.allergies) ? profile.allergies.join(", ") : "",
    });
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync name form when user changes
  useEffect(() => {
    if (user?.name) nameForm.reset({ name: user.name });
  }, [user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──

  const onUpdateName = async (data: NameData) => {
    await updateName(data.name);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const formData = new FormData();
    formData.append("file", file);
    setAvatarLoading(true);
    try {
      await api.post("/users/uploadfile", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const onUpdateMetrics = async (data: MetricsData) => {
    await updateProfile(data as Partial<Profile>);
  };

  const onUpdateDiet = async (data: DietData) => {
    const allergiesArr = data.allergies.split(",").map((s) => s.trim()).filter(Boolean);
    await updateProfile({ ...data, allergies: allergiesArr } as Partial<Profile>);
  };

  const onChangePassword = async (data: PasswordData) => {
    await changePassword(data.password);
    pwForm.reset();
  };

  const handleDelete = async () => {
    await deleteAccount();
    await logout();
    router.push("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  // Loading skeleton
  if (loading && !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your personal info, metrics, and preferences.</p>
      </div>

      {/* 1. Personal Info */}
      <SectionCard title="Personal Info">
        {/* Name */}
        <form onSubmit={nameForm.handleSubmit(onUpdateName)} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="name">Display Name</label>
            <input id="name" {...nameForm.register("name")} className={inputCls} placeholder="Your name" />
            <FieldError msg={nameForm.formState.errors.name?.message} />
          </div>
          <button type="submit" disabled={nameForm.formState.isSubmitting} className={submitBtnCls}>
            {nameForm.formState.isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Save Name
          </button>
        </form>

        {/* Avatar */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className={labelCls}>Profile Photo</p>
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-green-500" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                {initials}
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarLoading} className={submitBtnCls}>
                {avatarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Photo
              </button>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 2 MB</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 2. Body Metrics */}
      <SectionCard title="Body Metrics">
        <form onSubmit={metricsForm.handleSubmit(onUpdateMetrics)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                { id: "age", label: "Age (years)", key: "age" },
                { id: "height", label: "Height (cm)", key: "height" },
                { id: "weight", label: "Current Weight (kg)", key: "weight" },
                { id: "targetWeight", label: "Target Weight (kg)", key: "targetWeight" },
              ] as const
            ).map(({ id, label, key }) => (
              <div key={id}>
                <label className={labelCls} htmlFor={id}>{label}</label>
                <input
                  id={id}
                  type="number"
                  step="0.1"
                  {...metricsForm.register(key, { valueAsNumber: true })}
                  className={inputCls}
                  placeholder="0"
                />
                <FieldError msg={metricsForm.formState.errors[key]?.message} />
              </div>
            ))}
          </div>
          <div>
            <label className={labelCls} htmlFor="dailyBudget">Daily Food Budget (₹)</label>
            <input
              id="dailyBudget"
              type="number"
              {...metricsForm.register("dailyBudget", { valueAsNumber: true })}
              className={inputCls}
              placeholder="0"
            />
            <FieldError msg={metricsForm.formState.errors.dailyBudget?.message} />
          </div>
          <button type="submit" disabled={metricsForm.formState.isSubmitting} className={submitBtnCls}>
            {metricsForm.formState.isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Save Metrics
          </button>
        </form>
      </SectionCard>

      {/* 3. Diet Preferences */}
      <SectionCard title="Diet Preferences">
        <form onSubmit={dietForm.handleSubmit(onUpdateDiet)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="gender">Gender</label>
              <select id="gender" {...dietForm.register("gender")} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="activityLevel">Activity Level</label>
              <select id="activityLevel" {...dietForm.register("activityLevel")} className={inputCls}>
                <option value="sedentary">Sedentary</option>
                <option value="lightly_active">Lightly Active</option>
                <option value="moderately_active">Moderately Active</option>
                <option value="very_active">Very Active</option>
                <option value="extra_active">Extra Active</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="dietPlan">Goal</label>
            <select id="dietPlan" {...dietForm.register("dietPlan")} className={inputCls}>
              <option value="maintenance">Maintenance</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_gain">Weight Gain</option>
              <option value="muscle_gain">Muscle Gain</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="dietaryPreferences">Dietary Preferences</label>
            <input
              id="dietaryPreferences"
              type="text"
              placeholder="e.g. vegetarian, vegan, keto"
              {...dietForm.register("dietaryPreferences")}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="allergies">Allergies <span className="text-slate-400 font-normal">(comma-separated)</span></label>
            <input
              id="allergies"
              type="text"
              placeholder="e.g. peanuts, dairy, gluten"
              {...dietForm.register("allergies")}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={dietForm.formState.isSubmitting} className={submitBtnCls}>
            {dietForm.formState.isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Save Preferences
          </button>
        </form>
      </SectionCard>

      {/* 4. Security */}
      <SectionCard title="Security">
        <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...pwForm.register("password")}
              className={inputCls}
              placeholder="Min. 8 characters"
            />
            <FieldError msg={pwForm.formState.errors.password?.message} />
          </div>
          <div>
            <label className={labelCls} htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...pwForm.register("confirm")}
              className={inputCls}
              placeholder="Re-enter new password"
            />
            <FieldError msg={pwForm.formState.errors.confirm?.message} />
          </div>
          <button type="submit" disabled={pwForm.formState.isSubmitting} className={submitBtnCls}>
            {pwForm.formState.isSubmitting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </SectionCard>

      {/* 5. Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <h2 className="font-semibold text-red-700 text-base mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          Deleting your account is permanent and cannot be undone. All your data will be removed.
        </p>
        {deleteConfirm ? (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Yes, delete my account
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        )}
      </div>
    </div>
  );
}
