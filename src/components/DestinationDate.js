"use client";

import { useState } from "react";
import { CalendarIcon } from "./icons";
import { formatDMY } from "@/lib/date";

// Keeps the existing calendar-icon + DD/MM/YYYY presentation, with a real
// (transparent) date input overlaid so the native picker is used. State stays
// in the JSON's YYYY-MM-DD source format.
export default function DestinationDate({ value }) {
  const [date, setDate] = useState(value ?? "");
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-sm px-0.5 -mx-0.5 font-sans text-sm text-muted transition-colors hover:bg-stone/10 focus-within:bg-stone/10 focus-within:ring-1 focus-within:ring-forest/25">
      <CalendarIcon />
      <span>{date ? formatDMY(date) : "DD/MM/YYYY"}</span>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Destination date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
