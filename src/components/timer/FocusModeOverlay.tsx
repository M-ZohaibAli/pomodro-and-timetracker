"use client";

import React, { useEffect } from "react";
import { TimerStatus, SessionType, AmbientSoundType } from "@/types/focus";
import { formatTimeRemaining } from "@/lib/calculations";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  CheckCircle,
  Plus,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";

interface FocusModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  status: TimerStatus;
  mode: SessionType;
  taskTitle: string;
  project: string;
  remainingSeconds: number;
  totalDurationSeconds: number;
  cycleIndex: number;
  maxCycles: number;
  ambientSound: AmbientSoundType;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinishEarly: () => void;
  onAddOneMinute: () => void;
  onOpenDistractionModal: () => void;
}

export function FocusModeOverlay({
  isOpen,
  onClose,
  status,
  mode,
  taskTitle,
  project,
  remainingSeconds,
  totalDurationSeconds,
  cycleIndex,
  maxCycles,
  ambientSound,
  isMuted,
  onToggleMute,
  onPause,
  onResume,
  onFinishEarly,
  onAddOneMinute,
  onOpenDistractionModal,
}: FocusModeOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        if (status === "FOCUSING" || status === "SHORT_BREAK" || status === "LONG_BREAK") {
          onPause();
        } else if (status === "PAUSED") {
          onResume();
        }
      } else if (e.key.toLowerCase() === "m") {
        onToggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, status, onPause, onResume, onToggleMute, onClose]);

  if (!isOpen) return null;

  const isBreak = mode === "short_break" || mode === "long_break";
  const progressPercent =
    totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, ((totalDurationSeconds - remainingSeconds) / totalDurationSeconds) * 100))
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Distraction-free Focus Mode"
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-12 bg-neutral-950 text-white animate-in fade-in select-none"
    >
      {/* Top bar: minimal indicators */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {project || "Focus"}
          </span>
          {ambientSound !== "none" && (
            <button
              onClick={onToggleMute}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
              title="Toggle mute (M)"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              <span className="capitalize">{ambientSound.replace("_", " ")}</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
          title="Exit Focus Mode (Esc)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Focus Mode</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded text-neutral-400">
            ESC
          </kbd>
        </button>
      </div>

      {/* Main Center Area */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Task Title */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-neutral-100 max-w-xl line-clamp-2">
            {taskTitle || "Focus Session"}
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-neutral-900 border border-neutral-800">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "FOCUSING"
                  ? "bg-amber-400 animate-pulse"
                  : status === "PAUSED"
                  ? "bg-rose-400"
                  : isBreak
                  ? "bg-sky-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span className="text-neutral-300">
              {status === "PAUSED"
                ? "PAUSED"
                : mode === "short_break"
                ? "SHORT BREAK"
                : mode === "long_break"
                ? "LONG BREAK"
                : "FOCUSING"}
            </span>
          </div>
        </div>

        {/* Large Dominant Numeric Timer */}
        <div className="relative flex flex-col items-center justify-center py-4">
          <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white tabular-nums drop-shadow-sm">
            {formatTimeRemaining(remainingSeconds)}
          </div>

          {/* Minimal clean progress line */}
          <div className="w-64 sm:w-80 h-1 bg-neutral-800 rounded-full mt-6 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isBreak ? "bg-sky-400" : "bg-amber-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Pomodoro Cycle Dots */}
        <div className="flex items-center justify-center gap-2.5">
          {Array.from({ length: maxCycles }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx < cycleIndex
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : idx === cycleIndex && status === "FOCUSING"
                  ? "bg-amber-400/50 ring-2 ring-amber-400/40"
                  : "bg-neutral-800"
              }`}
            />
          ))}
          <span className="text-xs text-neutral-500 font-mono ml-1.5">
            {cycleIndex} of {maxCycles}
          </span>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {status === "PAUSED" ? (
            <button
              onClick={onResume}
              className="px-8 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-400/20"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-8 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm flex items-center gap-2 transition-transform active:scale-95 border border-neutral-700"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}

          <button
            onClick={onAddOneMinute}
            className="px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono border border-neutral-800 transition-colors flex items-center gap-1"
            title="Add 1 minute"
          >
            <Plus className="w-3.5 h-3.5" />
            1m
          </button>

          <button
            onClick={onFinishEarly}
            className="px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-800 transition-colors flex items-center gap-1.5"
            title="Complete session and record time"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Finish early
          </button>
        </div>
      </div>

      {/* Bottom Bar: distraction logging & shortcut hints */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pt-4 text-xs text-neutral-500">
        <button
          onClick={onOpenDistractionModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80 text-neutral-400 hover:text-amber-300 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Got distracted?</span>
        </button>

        <div className="flex items-center gap-4 text-[11px] text-neutral-500 hidden sm:flex">
          <span>Space: Pause/Resume</span>
          <span>M: Mute</span>
          <span>Esc: Exit</span>
        </div>
      </div>
    </div>
  );
}
