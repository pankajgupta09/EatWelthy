"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Search, RefreshCw, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type { Supermarket, SupermarketItem } from "@/types";

export default function GroceryPage() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");

  const fetchData = async () => {
    try {
      const { data } = await api.get<Supermarket[]>("/api/supermarkets/supermarket_data");
      setSupermarkets(Array.isArray(data) ? data : []);
    } catch {
      setSupermarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/api/scrape/bigbasket");
      toast.success("Data refresh started — please wait a moment and reload.");
      await fetchData();
    } catch {
      toast.error("Failed to trigger refresh");
    } finally {
      setRefreshing(false);
    }
  };

  // Flatten items for display
  type FlatItem = { store: string; name: string; price: number; unit: string };
  const allItems: FlatItem[] = supermarkets.flatMap((s) =>
    (s.food_items ?? []).map((item: SupermarketItem) => ({
      store: s.name,
      name: item.name,
      price: item.price,
      unit: item.unit,
    }))
  );

  const storeNames = ["all", ...Array.from(new Set(allItems.map((i) => i.store)))];

  const filtered = allItems.filter((item) => {
    const matchStore = selectedStore === "all" || item.store === selectedStore;
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.store.toLowerCase().includes(search.toLowerCase());
    return matchStore && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-600" /> Grocery Prices
          </h1>
          <p className="text-slate-500 text-sm mt-1">Live BigBasket price data for popular food items.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : allItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">No Price Data Available</h3>
          <p className="text-slate-500 text-sm mb-5">
            Click &quot;Refresh Data&quot; to scrape the latest prices from BigBasket.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {refreshing && <Loader2 className="w-4 h-4 animate-spin" />}
            Refresh Data
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items or stores…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {storeNames.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All Stores" : s}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400">{filtered.length} items</p>

          {/* Table */}
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No items match your search.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Store</th>
                    <th className="px-4 py-3 text-right">Price (₹)</th>
                    <th className="px-4 py-3 text-right">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.store}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
