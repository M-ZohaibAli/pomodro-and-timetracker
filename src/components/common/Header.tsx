"use client";

import React, { useState } from "react";
import {
  Timer as TimerIcon,
  CheckSquare,
  History,
  BarChart2,
  Settings as SettingsIcon,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { AmbientSoundType } from "@/types/focus";

interface HeaderProps {
  currentTab: "timer" | "tasks" | "history" | "analytics";
  onChangeTab: (tab: "timer" | "tasks" | "history" | "analytics") => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenTutorial: () => void;
  isDemoMode: boolean;
  onExitDemo: () => void;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onChangeAmbientSound: (type: AmbientSoundType) => void;
}

export function Header({
  currentTab,
  onChangeTab,
  onOpenSettings,
  onOpenShortcuts,
  onOpenTutorial,
  isDemoMode,
  onExitDemo,
  ambientSound,
  isMuted,
  onToggleMute,
  onChangeAmbientSound,
}: HeaderProps) {
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

  const ambientOptions: { id: AmbientSoundType; label: string }[] = [
    { id: "none", label: "Silence" },
    { id: "rain", label: "Rain" },
    { id: "white_noise", label: "White Noise" },
    { id: "brown_noise", label: "Brown Noise" },
    { id: "fan", label: "Fan" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/90 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChangeTab("timer")}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400 group-hover:bg-amber-300 text-neutral-950 flex items-center justify-center font-bold text-base transition-colors shadow-sm">
                F
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Focus
                </span>
                <span className="hidden sm:inline-block text-[10px] text-neutral-500 uppercase tracking-widest ml-2">
                  Timer & Journal
                </span>
              </div>
            </button>

            {isDemoMode && (
              <div className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>DEMO DATA</span>
                <button
                  onClick={onExitDemo}
                  className="ml-1 text-[10px] text-neutral-400 hover:text-white underline"
                  title="Exit demo mode"
                >
                  Exit
                </button>
              </div>
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-neutral-900 border border-neutral-800 p-1 text-xs">
            {(
              [
                { id: "timer", label: "Focus", icon: TimerIcon },
                { id: "tasks", label: "Tasks", icon: CheckSquare },
                { id: "history", label: "History", icon: History },
                { id: "analytics", label: "Analytics", icon: BarChart2 },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-neutral-800 text-white font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : ""}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Utility Tools: Ambient sound, tutorial, shortcuts, settings */}
          <div className="flex items-center gap-1.5">
            {/* Ambient Sound Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAmbientMenu(!showAmbientMenu)}
                className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs ${
                  ambientSound !== "none"
                    ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
                title="Ambient sounds"
              >
                {ambientSound !== "none" && !isMuted ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                {ambientSound !== "none" && (
                  <span className="hidden sm:inline capitalize text-[11px] font-mono">
                    {ambientSound.replace("_", " ")}
                  </span>
                )}
              </button>

              {/* Ambient Sound Dropdown */}
              {showAmbientMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-neutral-950 border border-neutral-800 p-2 shadow-2xl z-50 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                    Ambient Sound
                  </div>
                  {ambientOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onChangeAmbientSound(opt.id);
                        setShowAmbientMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        ambientSound === opt.id
                          ? "bg-neutral-800 text-amber-400 font-semibold"
                          : "text-neutral-300 hover:bg-neutral-900"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {ambientSound === opt.id && <span className="text-[10px] font-mono">●</span>}
                    </button>
                  ))}

                  {ambientSound !== "none" && (
                    <div className="pt-2 border-t border-neutral-800 px-1">
                      <button
                        onClick={onToggleMute}
                        className="w-full py-1 text-center text-[11px] text-neutral-400 hover:text-white"
                      >
                        {isMuted ? "Unmute Sound" : "Mute Sound"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tutorial */}
            <button
              onClick={onOpenTutorial}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Interactive tutorial"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {/* Shortcuts Help */}
            <button
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors hidden sm:block"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Section 80) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 px-3 py-2 flex items-center justify-around">
        {(
          [
            { id: "timer", label: "Focus", icon: TimerIcon },
            { id: "tasks", label: "Tasks", icon: CheckSquare },
            { id: "history", label: "History", icon: History },
            { id: "analytics", label: "Stats", icon: BarChart2 },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-amber-400 font-semibold" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
