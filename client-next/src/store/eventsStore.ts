import { create } from "zustand";
import api from "@/lib/axios";
import type { CalendarEvent } from "@/types";
import toast from "react-hot-toast";

interface EventsStore {
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  fetchEvents: (userId: string) => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, "id"> & { userId: string }) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  selectEvent: (event: CalendarEvent | null) => void;
}

function parseEvent(raw: any): CalendarEvent {
  return {
    id: raw._id || raw.id,
    title: raw.title,
    start: new Date(raw.start),
    end: new Date(raw.end),
    describe: raw.describe,
  };
}

export const useEventsStore = create<EventsStore>((set) => ({
  events: [],
  selectedEvent: null,

  fetchEvents: async (userId) => {
    try {
      const { data } = await api.get(`/events?id=${userId}`);
      set({ events: (data || []).map(parseEvent) });
    } catch {}
  },

  addEvent: async (event) => {
    try {
      const { data } = await api.post("/events", event);
      // Backend wraps the saved doc under data.data
      const raw = data?.data ?? data;
      set((s) => ({ events: [...s.events, parseEvent(raw)] }));
      toast.success("Event added");
    } catch {
      toast.error("Failed to add event");
    }
  },

  updateEvent: async (id, event) => {
    try {
      const { data } = await api.put(`/events/${id}/update`, event);
      const raw = data?.data ?? data;
      set((s) => ({ events: s.events.map((e) => (e.id === id ? parseEvent(raw) : e)) }));
      toast.success("Event updated");
    } catch {
      toast.error("Failed to update event");
    }
  },

  deleteEvent: async (id) => {
    try {
      await api.delete(`/events/${id}/delete`);
      set((s) => ({ events: s.events.filter((e) => e.id !== id), selectedEvent: null }));
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  },

  selectEvent: (event) => set({ selectedEvent: event }),
}));
