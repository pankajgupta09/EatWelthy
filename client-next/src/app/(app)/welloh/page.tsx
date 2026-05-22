"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function WellohPage() {
  const { profile, getProfile } = useProfileStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ensure profile is loaded
  useEffect(() => {
    getProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Init chat once profile resolves (or after 3s timeout)
  useEffect(() => {
    if (!initialising) return; // already done

    const run = async () => {
      const firstName = user?.name?.split(" ")[0] ?? "there";
      const fallbackGreeting = `Hi ${firstName}! I'm Welloh, your AI nutrition coach. Ask me anything about diet, meals, or health goals!`;

      try {
        const { data } = await api.post("/welloh/init", {
          userData: profile ? JSON.stringify(profile) : "No profile data yet",
        });
        // Backend returns [{role:"system",...},{role:"assistant",content:"..."}]
        const assistantMsg = Array.isArray(data)
          ? data.find((m: { role: string; content: string }) => m.role === "assistant")?.content
          : typeof data === "string"
          ? data
          : null;

        setMessages([{
          id: "init",
          role: "assistant",
          content: assistantMsg ?? fallbackGreeting,
        }]);
      } catch {
        setMessages([{ id: "init-fallback", role: "assistant", content: fallbackGreeting }]);
      } finally {
        setInitialising(false);
      }
    };

    // If profile hasn't loaded after 3 s, init anyway with whatever we have
    const timer = setTimeout(() => {
      if (initialising) run();
    }, 3000);

    if (profile !== null) {
      clearTimeout(timer);
      run();
    }

    return () => clearTimeout(timer);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/welloh/chat", { userMessage: text });
      // Backend returns a plain string via res.json(reply)
      const reply: string =
        typeof data === "string"
          ? data
          : data?.message ?? data?.response ?? data?.content ?? "I'm not sure about that.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-ai", role: "assistant", content: reply },
      ]);
    } catch {
      toast.error("Failed to get a response");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) sendMessage();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel */}
      <aside className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Welloh AI</h2>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Online
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What I can help with</p>
          <ul className="text-xs text-slate-600 space-y-1.5">
            {[
              "Personalised meal plans",
              "Calorie & macro guidance",
              "Indian diet advice",
              "Healthy recipe ideas",
              "Weight management tips",
              "Nutritional queries",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {profile && (profile.weight > 0 || profile.targetWeight > 0) && (
          <div className="bg-green-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Profile</p>
            {profile.dietPlan && (
              <p className="text-xs text-slate-600">Goal: <span className="font-semibold capitalize">{profile.dietPlan.replace(/_/g, " ")}</span></p>
            )}
            {profile.weight > 0 && (
              <p className="text-xs text-slate-600">Weight: <span className="font-semibold">{profile.weight} kg</span></p>
            )}
            {profile.targetWeight > 0 && (
              <p className="text-xs text-slate-600">Target: <span className="font-semibold">{profile.targetWeight} kg</span></p>
            )}
          </div>
        )}

        {/* Quick prompts */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick prompts</p>
          <div className="space-y-1.5">
            {[
              "Give me a high-protein meal plan",
              "What should I eat for weight loss?",
              "Healthy Indian breakfast ideas",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                disabled={initialising}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-700 transition-colors border border-slate-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 text-sm">Welloh</span>
            <p className="text-xs text-slate-400">AI Nutrition Coach</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {initialising ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-green-400" />
              <p className="text-slate-400 text-sm">Welloh is getting ready…</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === "user" ? "bg-slate-200" : "bg-green-600"
                    }`}
                  >
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-slate-600" />
                      : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>

                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-tr-sm"
                        : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Welloh anything about nutrition…"
            disabled={loading || initialising}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 bg-slate-50 focus:bg-white transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading || initialising || !input.trim()}
            className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
