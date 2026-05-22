"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "How do I log a meal?",
    answer:
      "Go to the Tracker page and select the 'Log Meal' tab. Fill in the date/time, meal type (breakfast, lunch, dinner, or snack), food name, and portion size in grams. Click 'Add Meal' to save it.",
  },
  {
    question: "How does the AI diet plan work?",
    answer:
      "EatWelthy uses your profile data — age, weight, height, activity level, dietary preferences, and goal — to generate a personalised meal plan via AI. Navigate to the Dashboard or Analysis page and click 'Generate Diet Plan'.",
  },
  {
    question: "What is Welloh AI?",
    answer:
      "Welloh is your personal AI nutrition coach. Ask it anything about your meals, macros, recipes, or health goals. It's context-aware and uses your profile data to give tailored advice.",
  },
  {
    question: "How do I add my own food to the database?",
    answer:
      "On the Tracker page, choose the 'Add Custom Food' tab. Enter the food name and its nutritional values per 100 g. Once saved, it appears in your Food Database tab.",
  },
  {
    question: "Can I change my diet plan goal?",
    answer:
      "Yes. Go to Profile → Diet Preferences and change the 'Diet Plan Goal' field (Weight Loss, Weight Gain, Muscle Gain, or Maintenance). Save, then regenerate your diet plan.",
  },
  {
    question: "What are dietary preferences and allergies used for?",
    answer:
      "They help Welloh AI and the diet plan generator avoid foods that don't suit you. For example, if you're vegetarian or allergic to gluten, AI-generated plans will respect those constraints.",
  },
  {
    question: "How do I view my recent meals?",
    answer:
      "Go to Tracker → Recent Meals, pick a date, and click 'Fetch Meals'. You'll see a table with nutritional totals including calories, protein, fat, and carbs.",
  },
  {
    question: "How does the Grocery section work?",
    answer:
      "The Grocery page shows scraped price data from BigBasket for common food items. You can search and filter by store. Click 'Refresh Data' to fetch the latest prices.",
  },
  {
    question: "How do I change my password?",
    answer:
      "Go to Profile → Security. Enter your new password (at least 8 characters) and confirm it, then click 'Update Password'.",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes. Go to Profile → Danger Zone and click 'Delete Account'. You'll be asked to confirm before the account and all associated data is permanently removed.",
  },
];

function AccordionItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-slate-800 text-sm pr-4">
          {index + 1}. {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-600" /> Frequently Asked Questions
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Everything you need to know about using EatWelthy.
        </p>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} faq={faq} index={i} />
        ))}
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-600">
          Still have questions?{" "}
          <span className="text-green-700 font-medium">
            Ask Welloh AI
          </span>{" "}
          — your personal nutrition coach is available 24/7.
        </p>
      </div>
    </div>
  );
}
