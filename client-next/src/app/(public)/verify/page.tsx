"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setCodeError("Enter the 6-digit code sent to your email.");
      return;
    }
    setCodeError("");
    setIsSubmitting(true);
    const ok = await verifyEmail(email, trimmed);
    setIsSubmitting(false);
    if (ok) router.push("/login");
  };

  const handleResend = async () => {
    setIsResending(true);
    await resendVerification(email);
    setIsResending(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify your email</h1>
        <p className="text-slate-500 text-sm mb-2">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-slate-700">{email || "your email"}</span>.
        </p>
        <p className="text-slate-400 text-xs mb-6">Check your spam folder if you don&apos;t see it.</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="code">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 tracking-widest text-center text-lg"
              placeholder="123456"
              autoComplete="one-time-code"
            />
            {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-green-600 hover:underline disabled:opacity-50"
          >
            {isResending ? "Resending…" : "Resend code"}
          </button>
          <div>
            <Link href="/login" className="text-xs text-slate-400 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md"><div className="bg-white rounded-2xl p-8 text-center text-slate-400">Loading…</div></div>}>
      <VerifyForm />
    </Suspense>
  );
}
