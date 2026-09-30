"use client";

import React, { useState } from "react";
import { FocusSession, Task } from "@/types/focus";
import { formatDuration, getLocalDayString } from "@/lib/calculations";
import {
  Clock,
  Plus,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Calendar,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  PenTool,
} from "lucide-react";

interface HistoryViewProps {
  sessions: FocusSession[];
  tasks: Task[];
  onAddManualSession: (
    taskTitle: string,
    project: string,
    durationMinutes: number,
    date: string,
    notes?: string
  ) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportCsv: (timeframe: "all" | "week" | "month") => void;
  onExportJson: () => void;
}

export function HistoryView({
  sessions,
  tasks,
  onAddManualSession,
  onDeleteSession,
  onExportCsv,
  onExportJson,
}: HistoryViewProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualProject, setManualProject] = useState("General");
  const [manualMinutes, setManualMinutes] = useState(25);
  const [manualDate, setManualDate] = useState(getLocalDayString());
  const [manualNotes, setManualNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "focus" | "breaks" | "manual">("all");

  const todayStr = getLocalDayString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDayString(yesterdayDate);

  const filteredSessions = sessions.filter((s) => {
    if (typeFilter === "focus" && s.sessionType !== "focus") return false;
    if (typeFilter === "breaks" && s.sessionType === "focus") return false;
    if (typeFilter === "manual" && !s.isManual) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.taskTitle.toLowerCase().includes(q) ||
        (s.project && s.project.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group filtered sessions by day
  const groupedSessions: { title: string; date: string; items: FocusSession[] }[] = [];
  const map = new Map<string, FocusSession[]>();

  for (const s of filteredSessions) {
    const dStr = getLocalDayString(s.startedAt);
    if (!map.has(dStr)) map.set(dStr, []);
    map.get(dStr)?.push(s);
  }

  // Sort dates descending
  const sortedDates = Array.from(map.keys()).sort().reverse();
  for (const d of sortedDates) {
    let title = d;
    if (d === todayStr) title = "Today";
    else if (d === yesterdayStr) title = "Yesterday";
    else {
      title = new Date(d + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    groupedSessions.push({
      title,
      date: d,
      items: map.get(d) || [],
    });
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManualSession(
      manualTitle.trim(),
      manualProject.trim() || "General",
      Number(manualMinutes) || 25,
      manualDate,
      manualNotes.trim() || undefined
    );
    setShowManualModal(false);
    setManualTitle("");
    setManualNotes("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Focus History</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Log of all completed sessions, offline entries, and time investments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add time manually</span>
          </button>

          {/* Export Dropdown / buttons */}
          <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-0.5">
            <button
              onClick={() => onExportCsv("all")}
              className="px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Export all data as CSV (Excel / Sheets compatible)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={onExportJson}
              className="px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Export full JSON backup"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task, project, or notes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
          />
        </div>

        <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-0.5 self-start sm:self-auto">
          {(["all", "focus", "breaks", "manual"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                typeFilter === filter
                  ? "bg-neutral-800 text-white font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped session list */}
      <div className="space-y-6">
        {groupedSessions.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-neutral-950 border border-neutral-800/80 p-8 space-y-3">
            <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-semibold text-white">No sessions recorded yet</div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Your focus history will appear here automatically after your first session, or you can record offline work with the &ldquo;Add time manually&rdquo; button.
            </p>
          </div>
        ) : (
          groupedSessions.map((group) => {
            const dayFocusSec = group.items
              .filter((i) => i.sessionType === "focus")
              .reduce((acc, curr) => acc + curr.durationSeconds, 0);

            return (
              <div key={group.date} className="space-y-2.5">
                {/* Day Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      {group.title}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">({group.date})</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatDuration(dayFocusSec)} focused
                  </span>
                </div>

                {/* Session items */}
                <div className="space-y-1.5">
                  {group.items.map((session) => {
                    const isFocus = session.sessionType === "focus";
                    const startTime = new Date(session.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={session.id}
                        className="p-3 sm:p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-mono text-neutral-500 text-[11px] shrink-0">
                            {startTime}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white truncate">
                                {session.taskTitle}
                              </span>

                              <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                                {session.project || "General"}
                              </span>

                              {session.isManual && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-medium flex items-center gap-1">
                                  <PenTool className="w-2.5 h-2.5" />
                                  Manual entry
                                </span>
                              )}

                              {session.interrupted && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-medium flex items-center gap-1">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  Interrupted
                                </span>
                              )}

                              {!session.isManual && session.completed && isFocus && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium">
                                  Completed
                                </span>
                              )}
                            </div>

                            {session.notes && (
                              <p className="text-[11px] text-neutral-400 mt-0.5 italic">
                                &ldquo;{session.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Duration & Delete */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-semibold text-amber-400">
                            {formatDuration(session.durationSeconds)}
                          </span>

                          <button
                            onClick={() => onDeleteSession(session.id)}
                            className="p-1 rounded-lg hover:bg-neutral-900 text-neutral-500 hover:text-rose-400 transition-colors"
                            title="Delete session record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Entry Modal (Section 43) */}
      {showManualModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-entry-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
            <button
              onClick={() => setShowManualModal(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="manual-entry-title" className="text-lg font-bold text-white tracking-tight mb-1">
              Add Time Manually
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Forgot to start the timer? Record focused time spent offline or on other devices.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="manual-task-select" className="block text-xs font-medium text-neutral-300 mb-1">
                  Task name
                </label>
                {tasks.length > 0 && (
                  <select
                    id="manual-task-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        setManualTitle(e.target.value);
                        const t = tasks.find((item) => item.title === e.target.value);
                        if (t) setManualProject(t.project || "General");
                      }
                    }}
                    className="w-full mb-2 px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">Choose an existing task, or type below...</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.title}>
                        {t.title} ({t.project || "General"})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Build website landing page..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="manual-project-input" className="block text-xs font-medium text-neutral-300 mb-1">
                    Project / Category
                  </label>
                  <input
                    id="manual-project-input"
                    type="text"
                    value={manualProject}
                    onChange={(e) => setManualProject(e.target.value)}
                    placeholder="General"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="manual-duration-input" className="block text-xs font-medium text-neutral-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    id="manual-duration-input"
                    type="number"
                    min="1"
                    max="720"
                    required
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-date-input" className="block text-xs font-medium text-neutral-300 mb-1">
                  Date
                </label>
                <input
                  id="manual-date-input"
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label htmlFor="manual-notes-input" className="block text-xs font-medium text-neutral-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  id="manual-notes-input"
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Offline brainstorm with sketchbook..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
