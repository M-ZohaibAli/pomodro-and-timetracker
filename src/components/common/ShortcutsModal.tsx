"use client";

import React from "react";
import { X, Command } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Space", desc: "Start / Pause active timer" },
    { key: "F", desc: "Toggle distraction-free Fullscreen mode" },
    { key: "N", desc: "Create a new task" },
    { key: "M", desc: "Toggle mute on ambient sound" },
    { key: "Esc", desc: "Exit fullscreen mode / Close open modal" },
    { key: "?", desc: "Show keyboard shortcuts" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close shortcuts dialog"
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <h3 id="shortcuts-title" className="text-lg font-bold text-white tracking-tight">
              Keyboard Shortcuts
            </h3>
            <p className="text-xs text-neutral-400">Fast navigation without reaching for the mouse</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80"
            >
              <span className="text-xs text-neutral-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold text-neutral-200 bg-neutral-800 border border-neutral-700 rounded-md shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-neutral-500 text-center">
          Shortcuts are automatically disabled when typing in input fields.
        </p>
      </div>
    </div>
  );
}
