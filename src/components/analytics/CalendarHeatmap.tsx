"use client";

import React, { useState } from "react";
import { HeatmapDayData } from "@/types/focus";
import { formatDuration } from "@/lib/calculations";
import { Calendar, Info } from "lucide-react";

interface CalendarHeatmapProps {
  days: HeatmapDayData[];
}

export function CalendarHeatmap({ days }: CalendarHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDayData | null>(null);

  // Group into columns of 7 days (weeks)
  const weeks: HeatmapDayData[][] = [];
  let currentWeek: HeatmapDayData[] = [];

  for (let i = 0; i < days.length; i++) {
    currentWeek.push(days[i]);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const getIntensityClass = (level: number) => {
    switch (level) {
      case 1:
        return "bg-amber-950/60 border border-amber-800/40 hover:border-amber-500 text-amber-200";
      case 2:
        return "bg-amber-800/80 border border-amber-600/50 hover:border-amber-400 text-amber-100";
      case 3:
        return "bg-amber-600 border border-amber-500 hover:border-amber-300 text-neutral-950";
      case 4:
        return "bg-amber-400 border border-amber-300 hover:border-white shadow-[0_0_8px_rgba(251,191,36,0.3)] text-neutral-950";
      default:
        return "bg-neutral-900/80 border border-neutral-800/60 hover:border-neutral-700 text-neutral-500";
    }
  };

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="rounded-2xl bg-neutral-950 border border-neutral-800/90 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Focus Calendar Heatmap</h3>
          <span className="text-xs text-neutral-500 font-mono">Last 90 days</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-neutral-900 border border-neutral-800" title="0m" />
          <div className="w-3 h-3 rounded-sm bg-amber-950/60 border border-amber-800/40" title="< 45m" />
          <div className="w-3 h-3 rounded-sm bg-amber-800/80 border border-amber-600/50" title="45m - 1.5h" />
          <div className="w-3 h-3 rounded-sm bg-amber-600 border border-amber-500" title="1.5h - 3h" />
          <div className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-300" title="> 3h" />
          <span>More</span>
        </div>
      </div>

      {/* Grid container with horizontal scroll for small screens */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="inline-flex gap-1.5 min-w-max">
          {/* Day of week labels */}
          <div className="grid grid-rows-7 gap-1.5 pr-2 text-[10px] text-neutral-500 font-mono select-none">
            {dayLabels.map((lbl, idx) => (
              <div key={idx} className="h-3.5 flex items-center">
                {lbl}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1.5">
              {week.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className={`w-3.5 h-3.5 rounded-sm transition-all focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer ${getIntensityClass(
                      day.intensity
                    )} ${isSelected ? "ring-2 ring-white scale-125 z-10" : ""}`}
                    aria-label={`${day.date}: ${formatDuration(day.totalSeconds)} focused in ${
                      day.sessionCount
                    } sessions`}
                    title={`${day.date}: ${formatDuration(day.totalSeconds)} (${day.sessionCount} sessions)`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Inspector detail card for clicked day */}
      {selectedDay ? (
        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div>
            <div className="font-semibold text-white">
              {new Date(selectedDay.date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-neutral-400 mt-0.5">
              <span className="text-amber-400 font-mono font-bold">
                {formatDuration(selectedDay.totalSeconds)}
              </span>{" "}
              focused across{" "}
              <span className="text-white font-medium">{selectedDay.sessionCount}</span>{" "}
              {selectedDay.sessionCount === 1 ? "session" : "sessions"}
            </div>
          </div>

          {selectedDay.tasks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedDay.tasks.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px]"
                >
                  {t.title}: <span className="font-mono text-amber-300">{formatDuration(t.seconds)}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-neutral-500 italic text-[11px]">No focus recorded on this day.</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-neutral-500 italic">
          <Info className="w-3.5 h-3.5 text-neutral-400" />
          <span>Click any cell to inspect breakdown for that day</span>
        </div>
      )}
    </div>
  );
}
