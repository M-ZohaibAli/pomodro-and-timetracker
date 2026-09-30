"use client";

import React, { useState } from "react";
import { DistractionCategory } from "@/types/focus";
import { Smartphone, Globe, MessageSquare, UserX, HelpCircle, X } from "lucide-react";

interface DistractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (category: DistractionCategory, note?: string) => void;
}

export function DistractionModal({ isOpen, onClose, onLog }: DistractionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<DistractionCategory>("phone");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const categories: { id: DistractionCategory; label: string; icon: React.ReactNode }[] = [
    { id: "phone", label: "Phone notification or check", icon: <Smartphone className="w-4 h-4 text-amber-400" /> },
    { id: "social", label: "Social media feed / infinite scroll", icon: <Globe className="w-4 h-4 text-sky-400" /> },
    { id: "browser", label: "Browser tabs / rabbit hole", icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { id: "person", label: "Colleague, family, or someone interrupted me", icon: <UserX className="w-4 h-4 text-rose-400" /> },
    { id: "other", label: "Mind wandering / Other thought", icon: <HelpCircle className="w-4 h-4 text-purple-400" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLog(selectedCategory, note.trim() || undefined);
    setNote("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="distraction-title"
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

        <h3 id="distraction-title" className="text-lg font-bold text-white tracking-tight mb-1">
          Log a Distraction
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          Tracking what pulls your focus helps you spot patterns over time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {categories.map((c) => (
              <label
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedCategory === c.id
                    ? "bg-neutral-900 border-amber-500/70 text-white shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900/60"
                }`}
              >
                <input
                  type="radio"
                  name="distractionCategory"
                  value={c.id}
                  checked={selectedCategory === c.id}
                  onChange={() => setSelectedCategory(c.id)}
                  className="sr-only"
                />
                <div className="p-1 rounded-lg bg-neutral-900 border border-neutral-800">{c.icon}</div>
                <span className="text-xs font-medium">{c.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label htmlFor="distraction-note" className="block text-xs font-medium text-neutral-400 mb-1.5">
              Quick note (optional)
            </label>
            <input
              id="distraction-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Replied to Slack message..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              maxLength={120}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              Log & Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
