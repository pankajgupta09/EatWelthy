import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found | EatWelthy",
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>

      <h1 className="text-7xl font-black text-slate-200 leading-none">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-slate-500 text-sm mt-3 max-w-sm">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        className="mt-8 bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3 text-sm font-semibold transition-colors inline-flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Go Home
      </Link>
    </div>
  );
}
