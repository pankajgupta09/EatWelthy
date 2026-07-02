"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { Loader2, X, CalendarDays, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useEventsStore } from "@/store/eventsStore";
import type { CalendarEvent } from "@/types";
import toast from "react-hot-toast";

const BigCalendarView = dynamic(() => import("@/components/BigCalendarView"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
    </div>
  ),
});

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
  mode: "add" | "edit";
  event: CalendarEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const CLOSED: ModalState = { open: false, mode: "add", event: null };

function pad(n: number) { return String(n).padStart(2, "0"); }
function toDatetimeLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventModal({
  state, onClose, onSave, onDelete, saving,
}: {
  state: ModalState;
  onClose: () => void;
  onSave: (d: { title: string; start: Date; end: Date; describe: string }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [describe, setDescribe] = useState("");
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");

  useEffect(() => {
    if (!state.open) return;
    setTitle(state.event?.title ?? "");
    setDescribe(state.event?.describe ?? "");
    const s = state.event?.start ?? state.defaultStart ?? new Date();
    const e = state.event?.end ?? state.defaultEnd ?? new Date(Date.now() + 3600_000);
    setStartStr(toDatetimeLocal(s));
    setEndStr(toDatetimeLocal(e));
  }, [state.open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.open) return null;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) { toast.error("Invalid dates"); return; }
    if (end <= start) { toast.error("End must be after start"); return; }
    onSave({ title: title.trim(), start, end, describe: describe.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg">
            {state.mode === "add" ? "Add Event" : "Edit Event"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High-protein breakfast"
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Start</label>
              <input type="datetime-local" value={startStr} onChange={(e) => setStartStr(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">End</label>
              <input type="datetime-local" value={endStr} onChange={(e) => setEndStr(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
            <textarea value={describe} onChange={(e) => setDescribe(e.target.value)}
              placeholder="Optional…" rows={3}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            {state.mode === "edit" && (
              <button type="button" onClick={onDelete} disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            <button type="button" onClick={onClose}
              className="ml-auto px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {state.mode === "add" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { events, fetchEvents, addEvent, updateEvent, deleteEvent } = useEventsStore();
  const [view, setView] = useState("month");
  const [modal, setModal] = useState<ModalState>(CLOSED);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?._id) fetchEvents(user._id);
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = useCallback((slot: { start: Date; end: Date }) => {
    setModal({ open: true, mode: "add", event: null, defaultStart: slot.start, defaultEnd: slot.end });
  }, []);

  const openEdit = useCallback((ev: CalendarEvent) => {
    setModal({ open: true, mode: "edit", event: ev });
  }, []);

  const close = useCallback(() => setModal(CLOSED), []);

  const handleSave = async (d: { title: string; start: Date; end: Date; describe: string }) => {
    if (!user?._id) return;
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await addEvent({ ...d, userId: user._id });
      } else if (modal.event) {
        await updateEvent(modal.event.id, d);
      }
      close();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.event) return;
    setSaving(true);
    try { await deleteEvent(modal.event.id); close(); }
    finally { setSaving(false); }
  };

  const now = new Date();
  const thisMonth = events.filter(
    (e) => e.start.getMonth() === now.getMonth() && e.start.getFullYear() === now.getFullYear()
  ).length;
  const upcoming = events.filter((e) => e.start > now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-green-600" /> Health Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Click a slot to add, click an event to edit.</p>
        </div>
        <button
          onClick={() => openAdd({ start: new Date(), end: new Date(Date.now() + 3600_000) })}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: events.length },
          { label: "This Month", value: thisMonth },
          { label: "Upcoming", value: upcoming.length },
          { label: "Past", value: events.filter((e) => e.end < now).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
        <style>{`
          .rbc-toolbar { flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
          .rbc-toolbar button { border-radius: 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 0.8rem; padding: 6px 12px; cursor: pointer; }
          .rbc-toolbar button:hover, .rbc-toolbar button.rbc-active { background: #16a34a !important; color: #fff !important; border-color: #16a34a !important; }
          .rbc-toolbar-label { font-weight: 700; color: #0f172a; font-size: 1rem; }
          .rbc-header { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; padding: 8px 0; }
          .rbc-off-range-bg { background: #f8fafc; }
          .rbc-today { background: #f0fdf4 !important; }
          .rbc-event { font-size: 0.72rem; }
          .rbc-show-more { color: #16a34a; font-size: 0.72rem; }
          .rbc-month-row { min-height: 80px; }
        `}</style>
        <BigCalendarView
          events={events}
          onSelectEvent={openEdit}
          onSelectSlot={openAdd}
          onView={setView}
          view={view}
        />
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Upcoming Events</h2>
          <div className="space-y-2">
            {upcoming
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .slice(0, 5)
              .map((ev) => (
                <div key={ev.id} onClick={() => openEdit(ev)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex flex-col items-center justify-center text-green-700 flex-shrink-0">
                    <span className="text-xs font-bold leading-none">{ev.start.getDate()}</span>
                    <span className="text-[10px] uppercase">{ev.start.toLocaleString("en-IN", { month: "short" })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-slate-400">
                      {ev.start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {ev.end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Pencil className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </div>
              ))}
          </div>
        </div>
      )}

      <EventModal state={modal} onClose={close} onSave={handleSave} onDelete={handleDelete} saving={saving} />
    </div>
  );
}
