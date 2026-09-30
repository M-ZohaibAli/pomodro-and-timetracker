"use client";

import React, { useState } from "react";
import { CheckCircle2, Play, Coffee, BarChart3, LineChart, Sparkles, X, ChevronRight, ChevronLeft } from "lucide-react";

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: () => void;
}

export function InteractiveTutorial({ isOpen, onClose, onStartFocus }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Pick something to work on",
      subtitle: "Attach focus time directly to your real work",
      icon: <CheckCircle2 className="w-8 h-8 text-amber-500" />,
      content: (
        <div className="space-y-3 text-sm text-neutral-300">
          <p>Create a lightweight task to keep yourself anchored:</p>
          <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-amber-300/90">
            <div>• &ldquo;Study Mathematics&rdquo;</div>
            <div>• &ldquo;Build my website&rdquo;</div>
            <div>• &ldquo;Read chapter 4&rdquo;</div>
          </div>
          <p className="text-neutral-400">
            Your focused time will automatically accumulate towards this task.
          </p>
        </div>
      ),
    },
    {
      title: "2. Start focusing",
      subtitle: "Simple, immediate action",
      icon: <Play className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-3 text-sm text-neutral-300">
          <p>Press <span className="font-semibold text-white">Start</span>. That&apos;s it.</p>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">25:00</span>
            <div className="mt-1 text-xs text-emerald-400 font-medium">FOCUSING</div>
          </div>
          <p className="text-neutral-400">
            Timer runs accurately across tabs, background sleep, and mobile screens.
          </p>
        </div>
      ),
    },
    {
      title: "3. Take breaks",
      subtitle: "Paced cycles prevent burnout",
      icon: <Coffee className="w-8 h-8 text-sky-400" />,
      content: (
        <div className="space-y-3 text-sm text-neutral-300">
          <p>When your 25-minute focus session finishes, Focus prompts you to step back and rest.</p>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-300">Short Break</span>
            <span className="font-mono text-sky-400 font-bold">05:00</span>
          </div>
          <p className="text-neutral-400">
            Every 4 cycles, you&apos;ll be guided into a 15-minute restorative long break.
          </p>
        </div>
      ),
    },
    {
      title: "4. Your time is tracked automatically",
      subtitle: "No manual spreadsheets or stopwatches",
      icon: <BarChart3 className="w-8 h-8 text-violet-400" />,
      content: (
        <div className="space-y-3 text-sm text-neutral-300">
          <p>Every second you dedicate is logged and attributed.</p>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white font-medium">Build website</span>
              <span className="text-amber-400 font-mono">1h 45m</span>
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-3/4 rounded-full" />
            </div>
          </div>
          <p className="text-neutral-400">
            Forgot to start the timer? You can also add time manually with one click.
          </p>
        </div>
      ),
    },
    {
      title: "5. Understand your habits",
      subtitle: "Actionable, transparent analytics",
      icon: <LineChart className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-2 text-sm text-neutral-300">
          <p>Your history and personal journal show:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-neutral-300 pl-1">
            <li>Total focused hours today, this week, and this month</li>
            <li>Consecutive daily focus streak</li>
            <li>GitHub-style 90-day activity heat map</li>
            <li>Transparent Focus Score based on consistency and completion</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Ready?",
      subtitle: "Let's start your first session",
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      content: (
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-neutral-300">
            No signup. No account. Your data stays securely right here on your device.
          </p>
          <button
            onClick={() => {
              onClose();
              onStartFocus();
            }}
            className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950/40 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Start focusing
          </button>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close tutorial"
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-7 bg-amber-500"
                  : idx < currentStep
                  ? "w-2 bg-neutral-600"
                  : "w-2 bg-neutral-800"
              }`}
            />
          ))}
          <span className="text-xs text-neutral-500 ml-2 font-mono">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Step header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0">
            {current.icon}
          </div>
          <div>
            <h3 id="tutorial-title" className="text-xl font-bold text-white tracking-tight">
              {current.title}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">{current.subtitle}</p>
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[140px] mb-6">{current.content}</div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded transition-colors"
          >
            Skip tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg border border-neutral-700 hover:bg-neutral-800 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
