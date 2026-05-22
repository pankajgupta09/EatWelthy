"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import { parse } from "date-fns";
import { startOfWeek } from "date-fns";
import { getDay } from "date-fns";
import { enIN } from "date-fns/locale/en-IN";
import type { CalendarEvent } from "@/types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-IN": enIN },
});

interface Props {
  events: CalendarEvent[];
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  onView: (v: string) => void;
  view: string;
}

export default function BigCalendarView({ events, onSelectEvent, onSelectSlot, onView, view }: Props) {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      titleAccessor="title"
      style={{ height: 560 }}
      selectable
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      view={view as any}
      onView={onView}
      popup
      eventPropGetter={() => ({
        style: {
          backgroundColor: "#16a34a",
          borderRadius: "6px",
          border: "none",
          color: "#fff",
          fontSize: "0.75rem",
          padding: "2px 6px",
        },
      })}
    />
  );
}
