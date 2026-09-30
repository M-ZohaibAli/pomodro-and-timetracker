"use client";

import React, { useState } from "react";
import { formatTimeRemaining } from "@/lib/calculations";
import { AlertTriangle, X } from "lucide-react";
import { Task } from "@/types/focus";

interface TaskSwitchModalProps {
  isOpen: boolean;
  elapsedSeconds: number;
  currentTaskTitle: string;
  newTask: Task | null;
  onClose: () => void;
  onChoice: (choice: "split_keep" | "reassign_continue" | "stop_save") => void;
}

export function TaskSwitchModal({
  isOpen,
  elapsedSeconds,
  currentTaskTitle,
  newTask,
  onClose,
  onChoice,
}: TaskSwitchModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<"split_keep" | "reassign_continue" | "stop_save">(
    "split_keep"
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-task-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="switch-task-title" className="text-base font-bold text-white tracking-tight">
              Switch active task?
            </h3>
            <p className="text-xs text-neutral-400">
              Session elapsed: <span className="font-mono text-amber-400 font-bold">{formatTimeRemaining(elapsedSeconds)}</span> on &ldquo;{currentTaskTitle}&rdquo;
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-4">
          How would you like to attribute the time spent so far?
        </p>

        <div className="space-y-2.5 mb-6">
          <label
            onClick={() => setSelectedChoice("split_keep")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedChoice === "split_keep"
                ? "bg-neutral-900 border-amber-500/70 text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900/40"
            }`}
          >
            <input
              type="radio"
              name="switchChoice"
              checked={selectedChoice === "split_keep"}
              onChange={() => setSelectedChoice("split_keep")}
              className="mt-0.5 text-amber-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Keep time with current task</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Save the {formatTimeRemaining(elapsedSeconds)} to &ldquo;{currentTaskTitle}&rdquo; and start a fresh session for &ldquo;{newTask?.title || "New task"}&rdquo;.
              </div>
            </div>
          </label>

          <label
            onClick={() => setSelectedChoice("reassign_continue")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedChoice === "reassign_continue"
                ? "bg-neutral-900 border-amber-500/70 text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900/40"
            }`}
          >
            <input
              type="radio"
              name="switchChoice"
              checked={selectedChoice === "reassign_continue"}
              onChange={() => setSelectedChoice("reassign_continue")}
              className="mt-0.5 text-amber-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Switch and continue</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Reassign this entire running session to &ldquo;{newTask?.title || "New task"}&rdquo; without resetting the timer.
              </div>
            </div>
          </label>

          <label
            onClick={() => setSelectedChoice("stop_save")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedChoice === "stop_save"
                ? "bg-neutral-900 border-amber-500/70 text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900/40"
            }`}
          >
            <input
              type="radio"
              name="switchChoice"
              checked={selectedChoice === "stop_save"}
              onChange={() => setSelectedChoice("stop_save")}
              className="mt-0.5 text-amber-500"
            />
            <div>
              <div className="text-xs font-semibold text-white">Stop session now</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Save the {formatTimeRemaining(elapsedSeconds)} as a completed session and return to idle.
              </div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onChoice(selectedChoice);
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
