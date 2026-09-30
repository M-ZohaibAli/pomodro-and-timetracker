"use client";

import React, { useState } from "react";
import {
  TimerStatus,
  SessionType,
  Task,
  UserSettings,
} from "@/types/focus";
import { formatTimeRemaining, formatDuration } from "@/lib/calculations";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle,
  Plus,
  Maximize2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Layers,
  Coffee,
} from "lucide-react";

interface TimerDisplayProps {
  status: TimerStatus;
  mode: SessionType;
  remainingSeconds: number;
  totalDurationSeconds: number;
  currentTask: Task | null;
  tasks: Task[];
  quickTaskInput: string;
  onChangeQuickTaskInput: (val: string) => void;
  onSelectTask: (task: Task | null) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onFinishEarly: () => void;
  onReset: () => void;
  onAddMinutes: (minutes: number) => void;
  onStartBreak: (type: "short_break" | "long_break") => void;
  onStartNextFocus: () => void;
  onOpenFocusMode: () => void;
  onOpenDistractionModal: () => void;
  onOpenTutorial: () => void;
  onLoadDemoData: () => void;
  cycleIndex: number;
  maxCycles: number;
  todayFocusSeconds: number;
  todaySessionCount: number;
  todayCompletedCount: number;
  settings: UserSettings;
  isFirstUse: boolean;
}

export function TimerDisplay({
  status,
  mode,
  remainingSeconds,
  totalDurationSeconds,
  currentTask,
  tasks,
  quickTaskInput,
  onChangeQuickTaskInput,
  onSelectTask,
  onStart,
  onPause,
  onResume,
  onSkip,
  onFinishEarly,
  onReset,
  onAddMinutes,
  onStartBreak,
  onStartNextFocus,
  onOpenFocusMode,
  onOpenDistractionModal,
  onOpenTutorial,
  onLoadDemoData,
  cycleIndex,
  maxCycles,
  todayFocusSeconds,
  todaySessionCount,
  todayCompletedCount,
  settings,
  isFirstUse,
}: TimerDisplayProps) {
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  const isBreak = mode === "short_break" || mode === "long_break";
  const isRunning = status === "FOCUSING" || (isBreak && status !== "PAUSED" && status !== "IDLE");
  const isPaused = status === "PAUSED";
  const isCompleted = status === "COMPLETED";

  // Calculate percentage for circular progress ring
  const progressPercent =
    totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100))
      : 0;

  // SVG circular properties
  const radius = 135;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center space-y-6 pt-2 pb-12 animate-in fade-in">
      {/* First-Use Welcome Experience (Section 4) */}
      {isFirstUse && status === "IDLE" && (
        <div className="w-full p-5 sm:p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 text-center space-y-3.5 shadow-xl animate-in slide-in-from-top-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold text-lg mx-auto shadow-md">
            F
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">Welcome to Focus</h2>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              Turn focused time into visible progress. Choose something you&apos;re working on, start the timer, and we&apos;ll track the rest.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={onStart}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs shadow-md transition-colors"
            >
              Start a quick focus session
            </button>
            <button
              onClick={onOpenTutorial}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
            >
              Show me how it works
            </button>
            <button
              onClick={onLoadDemoData}
              className="px-3 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              Try with sample data
            </button>
          </div>
        </div>
      )}

      {/* Task Anchor Header (Section 13, 14, 15) */}
      <div className="w-full flex flex-col items-center space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 font-mono">
          {mode === "focus" ? "Current Task" : "Rest Period"}
        </div>

        {mode === "focus" ? (
          <div className="relative w-full max-w-md">
            {currentTask ? (
              <div className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-white truncate">
                    {currentTask.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] text-neutral-400 shrink-0">
                    {currentTask.project || "General"}
                  </span>
                </div>

                <button
                  onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                  title="Switch task"
                  aria-label="Switch task"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={quickTaskInput}
                  onChange={(e) => onChangeQuickTaskInput(e.target.value)}
                  placeholder="What are you working on? (e.g. Build website)"
                  className="w-full px-4 py-2.5 text-xs text-white placeholder-neutral-500 rounded-2xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                {tasks.length > 0 && (
                  <button
                    onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
                    title="Choose from existing tasks"
                    aria-label="Choose from existing tasks"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Task switcher dropdown */}
            {showTaskDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-1 max-h-56 overflow-y-auto text-xs animate-in fade-in">
                <div className="px-2 py-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold flex justify-between">
                  <span>Switch or pick task</span>
                  <button
                    onClick={() => onSelectTask(null)}
                    className="text-amber-400 hover:underline"
                  >
                    Clear selection
                  </button>
                </div>

                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTask(t);
                      setShowTaskDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      currentTask?.id === t.id
                        ? "bg-neutral-900 text-amber-300 font-semibold"
                        : "text-neutral-300 hover:bg-neutral-900/80"
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[10px] text-neutral-500 font-mono ml-2 shrink-0">
                      {t.project || "General"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/40 border border-sky-900/50 text-xs text-sky-300">
            <Coffee className="w-3.5 h-3.5" />
            <span>
              {mode === "short_break" ? "5-minute Short Break" : "15-minute Long Break"} — Step away and rest
            </span>
          </div>
        )}
      </div>

      {/* Main Memorable Circular Timer Display */}
      <div className="relative flex items-center justify-center my-2">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          {/* Background circle track */}
          <circle
            stroke="#262626"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={isBreak ? "#38bdf8" : "#fbbf24"}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-center">
          {/* Numeric time */}
          <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white tabular-nums drop-shadow-md">
            {formatTimeRemaining(remainingSeconds)}
          </span>

          {/* State Badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-neutral-900 border border-neutral-800">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? "bg-amber-400 animate-pulse"
                  : isPaused
                  ? "bg-rose-400"
                  : isCompleted
                  ? "bg-emerald-400"
                  : "bg-neutral-500"
              }`}
            />
            <span className="text-neutral-300">
              {status === "PAUSED"
                ? "PAUSED"
                : mode === "short_break"
                ? "SHORT BREAK"
                : mode === "long_break"
                ? "LONG BREAK"
                : status === "COMPLETED"
                ? "COMPLETED"
                : status === "FOCUSING"
                ? "FOCUSING"
                : "IDLE"}
            </span>
          </div>

          {/* Cycle dots indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array.from({ length: maxCycles }).map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx < cycleIndex
                    ? "bg-amber-400"
                    : idx === cycleIndex && status === "FOCUSING"
                    ? "bg-amber-400/50 ring-2 ring-amber-400/30"
                    : "bg-neutral-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Primary Action Controls (Section 7, 53) */}
      <div className="w-full flex flex-col items-center space-y-3">
        {/* Completion State Banner (Section 18, 75) */}
        {isCompleted ? (
          <div className="w-full max-w-md p-4 rounded-2xl bg-neutral-900 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95">
            <div className="inline-flex p-2 rounded-full bg-emerald-500/10 text-emerald-400 mb-1">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Nice work! Focus complete.</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                {currentTask?.title || "Focus Session"} • Pomodoro #{todayCompletedCount} today
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() =>
                  onStartBreak(
                    cycleIndex >= settings.sessionsBeforeLongBreak ? "long_break" : "short_break"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Coffee className="w-4 h-4" />
                <span>
                  Start {cycleIndex >= settings.sessionsBeforeLongBreak ? "15" : "5"} min break
                </span>
              </button>

              <button
                onClick={onStartNextFocus}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors"
              >
                Start another session
              </button>

              <button
                onClick={onReset}
                className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Normal Play/Pause/Control Bar */
          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === "IDLE" ? (
              <button
                onClick={onStart}
                className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START {formatTimeRemaining(settings.focusDurationMinutes * 60)}</span>
              </button>
            ) : isPaused ? (
              <>
                <button
                  onClick={onResume}
                  className="px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={onFinishEarly}
                  className="px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs flex items-center gap-1.5 transition-colors"
                  title="Finish session and save time"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Finish & Record</span>
                </button>
                <button
                  onClick={onReset}
                  className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                  title="Cancel and discard session"
                  aria-label="Cancel and discard session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Active Focusing or Breaking */
              <>
                <button
                  onClick={onPause}
                  className="px-8 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
                >
                  <Pause className="w-4 h-4" />
                  <span>PAUSE</span>
                </button>

                <button
                  onClick={() => onAddMinutes(1)}
                  className="px-3.5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs flex items-center gap-1 transition-colors"
                  title="Add 1 minute"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>1m</span>
                </button>

                <button
                  onClick={onSkip}
                  className="p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title={isBreak ? "Skip break" : "Skip focus session"}
                  aria-label={isBreak ? "Skip break" : "Skip focus session"}
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={onFinishEarly}
                  className="px-4 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                  title="Complete session early"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Finish</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Secondary utility triggers: Fullscreen mode & Distraction log */}
        <div className="flex items-center gap-3 pt-2 text-xs text-neutral-400">
          <button
            onClick={onOpenFocusMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Toggle Fullscreen Focus Mode (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Fullscreen Mode</span>
            <kbd className="hidden sm:inline font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">
              F
            </kbd>
          </button>

          {isRunning && mode === "focus" && (
            <button
              onClick={onOpenDistractionModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-amber-300 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Log distraction</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Compact Progress Footer (Section 7, 40) */}
      <div className="w-full max-w-md pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
        <div>
          <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-semibold">
            Today&apos;s Focus
          </span>
          <span className="font-mono text-base font-bold text-white">
            {formatDuration(todayFocusSeconds)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-neutral-500 block text-[10px] uppercase tracking-wider font-semibold">
            Completed Sessions
          </span>
          <span className="font-mono text-base font-bold text-amber-400">
            {todayCompletedCount}{" "}
            <span className="text-xs font-normal text-neutral-500">
              ({todaySessionCount} total)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
