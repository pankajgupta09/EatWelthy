import { MapPin } from "lucide-react";

export const metadata = {
  title: "Store Locator — EatWelthy",
};

export default function LocationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center">
        <MapPin className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Store Locator</h1>
        <p className="text-slate-500 mt-2 text-lg">Coming Soon</p>
      </div>

      <div className="max-w-md">
        <p className="text-slate-500 text-sm leading-relaxed">
          We&apos;re working on an interactive map to help you find healthy food stores, supermarkets, and restaurants near you.
        </p>
        <p className="text-slate-400 text-xs mt-3">
          Note: This feature requires <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to be configured.
        </p>
      </div>
    </div>
  );
}
