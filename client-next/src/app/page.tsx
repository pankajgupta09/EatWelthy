import Link from "next/link";
import { Utensils, Brain, BarChart2 } from "lucide-react";

export const metadata = {
  title: "EatWelthy — Your Health & Nutrition Companion",
  description: "Track meals, get AI-powered diet plans, and achieve your health goals.",
};

export default function LandingPage() {
  const features = [
    {
      icon: Utensils,
      title: "Track Meals",
      description:
        "Log every meal with detailed nutritional breakdown. Monitor calories, protein, carbs, and fats with ease.",
    },
    {
      icon: Brain,
      title: "AI Diet Plans",
      description:
        "Get personalised diet suggestions powered by AI, tailored to your goals, body metrics, and food preferences.",
    },
    {
      icon: BarChart2,
      title: "Smart Analytics",
      description:
        "Visualise your nutrition history, track progress toward your targets, and make informed dietary decisions.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 p-6 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-bold text-xl text-white">EatWelthy</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-36 px-6 text-center flex-shrink-0">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">EatWelthy</h1>
        <p className="text-xl text-green-100 max-w-xl mx-auto mb-10">
          Track your meals, discover AI-powered diet plans, and reach your health goals — all in one place.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-white text-green-700 hover:bg-green-50 font-semibold rounded-full px-7 py-3 text-sm transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-white text-white hover:bg-white/10 font-semibold rounded-full px-7 py-3 text-sm transition-colors"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20 px-6 flex-1">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-slate-800 mb-3">
            Everything you need to eat well
          </h2>
          <p className="text-center text-slate-500 mb-12 text-sm">
            A complete toolkit for smarter nutrition and lasting habits.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-xs bg-white border-t border-slate-100">
        © {new Date().getFullYear()} EatWelthy. All rights reserved.
      </footer>
    </div>
  );
}
