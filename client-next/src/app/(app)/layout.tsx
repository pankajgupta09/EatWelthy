"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  BarChart2,
  ShoppingCart,
  CalendarDays,
  MapPin,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tracker", href: "/tracker", icon: Utensils },
  { label: "Analysis", href: "/analysis", icon: BarChart2 },
  { label: "Grocery", href: "/grocery", icon: ShoppingCart },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Location", href: "/location", icon: MapPin },
  { label: "FAQs", href: "/faqs", icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, loading, loadUser, logout } = useAuthStore();
  const { getProfile } = useProfileStore();

  useEffect(() => {
    loadUser().then(() => {
      getProfile();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <span className="text-white font-bold text-lg tracking-tight">EatWelthy</span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-green-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? "Loading…"}</p>
            <Link href="/profile" className="text-slate-400 text-xs hover:text-green-400 transition-colors">
              View profile
            </Link>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-600/20 text-green-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Profile & Logout */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-green-600/20 text-green-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
