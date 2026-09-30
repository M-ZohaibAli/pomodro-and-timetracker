"use client";

import React, { useState, useRef } from "react";
import { UserSettings, PresetName, AmbientSoundType } from "@/types/focus";
import { audioEngine } from "@/lib/audio";
import { requestNotificationPermission, sendBrowserNotification } from "@/lib/notifications";
import {
  X,
  Sliders,
  Volume2,
  Bell,
  Target,
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onLoadDemoData: () => void;
  onExitDemoData: () => void;
  onClearAllData: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => { success: boolean; error?: string; taskCount?: number; sessionCount?: number };
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onLoadDemoData,
  onExitDemoData,
  onClearAllData,
  onExportCsv,
  onExportJson,
  onImportJson,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"timer" | "sound" | "goals" | "data">("timer");
  const [importNotice, setImportNotice] = useState<{ message: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const applyPreset = (preset: PresetName) => {
    switch (preset) {
      case "classic":
        onUpdateSettings({
          preset: "classic",
          focusDurationMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          sessionsBeforeLongBreak: 4,
        });
        break;
      case "deep":
        onUpdateSettings({
          preset: "deep",
          focusDurationMinutes: 50,
          shortBreakMinutes: 10,
          longBreakMinutes: 30,
          sessionsBeforeLongBreak: 3,
        });
        break;
      case "sprint":
        onUpdateSettings({
          preset: "sprint",
          focusDurationMinutes: 15,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          sessionsBeforeLongBreak: 4,
        });
        break;
      case "custom":
        onUpdateSettings({ preset: "custom" });
        break;
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      onUpdateSettings({ enableNotifications: granted });
      if (granted) {
        sendBrowserNotification("Focus notifications enabled", {
          body: "You will receive subtle alerts when sessions and breaks finish.",
        });
      }
    } else {
      onUpdateSettings({ enableNotifications: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        const res = onImportJson(content);
        if (res.success) {
          setImportNotice({
            message: `Successfully restored ${res.sessionCount} sessions and ${res.taskCount} tasks!`,
            isError: false,
          });
        } else {
          setImportNotice({
            message: res.error || "Failed to parse imported file.",
            isError: true,
          });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-title" className="text-lg font-bold text-white tracking-tight">
                Settings
              </h3>
              <p className="text-xs text-neutral-400">Customize intervals, sounds, and local data</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-850 px-5 gap-2 pt-2 bg-neutral-950">
          {(
            [
              { id: "timer", label: "Timer & Intervals", icon: Sliders },
              { id: "sound", label: "Audio & Alerts", icon: Volume2 },
              { id: "goals", label: "Daily Targets", icon: Target },
              { id: "data", label: "Data & Privacy", icon: Database },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-amber-400 text-amber-400 font-semibold"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-neutral-300">
          {/* TAB 1: TIMER & INTERVALS */}
          {activeTab === "timer" && (
            <div className="space-y-6">
              {/* Presets */}
              <div className="space-y-2">
                <label className="font-semibold text-white block">Timer Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "classic", label: "Classic", desc: "25 / 5 / 15" },
                      { id: "deep", label: "Deep Work", desc: "50 / 10 / 30" },
                      { id: "sprint", label: "Short Sprint", desc: "15 / 5 / 15" },
                      { id: "custom", label: "Custom", desc: "Flexible" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.preset === p.id
                          ? "bg-neutral-900 border-amber-400 text-white"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{p.label}</div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intervals custom controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="setting-focus-duration" className="block text-xs font-medium text-neutral-300 mb-1">
                    Focus Duration (minutes)
                  </label>
                  <input
                    id="setting-focus-duration"
                    type="number"
                    min="1"
                    max="180"
                    value={settings.focusDurationMinutes}
                    onChange={(e) => {
                      onUpdateSettings({
                        focusDurationMinutes: Math.max(1, Number(e.target.value)),
                        preset: "custom",
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="setting-short-break" className="block text-xs font-medium text-neutral-300 mb-1">
                    Short Break (minutes)
                  </label>
                  <input
                    id="setting-short-break"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakMinutes}
                    onChange={(e) => {
                      onUpdateSettings({
                        shortBreakMinutes: Math.max(1, Number(e.target.value)),
                        preset: "custom",
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="setting-long-break" className="block text-xs font-medium text-neutral-300 mb-1">
                    Long Break (minutes)
                  </label>
                  <input
                    id="setting-long-break"
                    type="number"
                    min="1"
                    max="90"
                    value={settings.longBreakMinutes}
                    onChange={(e) => {
                      onUpdateSettings({
                        longBreakMinutes: Math.max(1, Number(e.target.value)),
                        preset: "custom",
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label htmlFor="setting-sessions-cycle" className="block text-xs font-medium text-neutral-300 mb-1">
                    Sessions Before Long Break
                  </label>
                  <input
                    id="setting-sessions-cycle"
                    type="number"
                    min="1"
                    max="12"
                    value={settings.sessionsBeforeLongBreak}
                    onChange={(e) => {
                      onUpdateSettings({
                        sessionsBeforeLongBreak: Math.max(1, Number(e.target.value)),
                        preset: "custom",
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-3 pt-2 border-t border-neutral-850">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 cursor-pointer">
                  <div>
                    <div className="font-medium text-white">Auto-start Breaks</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Automatically begin break countdown when a focus session ends.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-800 border-neutral-700 focus:ring-amber-400"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 cursor-pointer">
                  <div>
                    <div className="font-medium text-white">Auto-start Focus Cycles</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Automatically begin next focus session when a break countdown ends.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoStartFocus}
                    onChange={(e) => onUpdateSettings({ autoStartFocus: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-800 border-neutral-700 focus:ring-amber-400"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: SOUND & ALERTS */}
          {activeTab === "sound" && (
            <div className="space-y-6">
              {/* Ambient Sound Choice */}
              <div className="space-y-2">
                <label className="font-semibold text-white block">Default Ambient Sound</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: "none", label: "Silence (Off)" },
                      { id: "rain", label: "Gentle Rain" },
                      { id: "white_noise", label: "White Noise" },
                      { id: "brown_noise", label: "Brown Noise" },
                      { id: "fan", label: "Gentle Fan" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ ambientSound: s.id });
                        audioEngine.playAmbient(s.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.ambientSound === s.id
                          ? "bg-neutral-900 border-amber-400 text-white"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Volume Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <label htmlFor="setting-ambient-volume" className="font-semibold text-white">Ambient Sound Volume</label>
                  <span className="font-mono text-amber-400">{settings.ambientVolume}%</span>
                </div>
                <input
                  id="setting-ambient-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.ambientVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    onUpdateSettings({ ambientVolume: vol });
                    audioEngine.setAmbientVolume(vol);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Chime Volume & Test */}
              <div className="space-y-3 pt-3 border-t border-neutral-850">
                <div className="flex justify-between items-center">
                  <div>
                    <label htmlFor="setting-chime-volume" className="font-semibold text-white block">Completion Chime Volume</label>
                    <span className="text-[11px] text-neutral-400">
                      Pleasant acoustic bell on session & break completion
                    </span>
                  </div>
                  <span className="font-mono text-amber-400">{settings.chimeVolume}%</span>
                </div>
                <input
                  id="setting-chime-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.chimeVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    onUpdateSettings({ chimeVolume: vol });
                    audioEngine.setChimeVolume(vol);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.setChimeVolume(settings.chimeVolume);
                    audioEngine.playSessionCompleteChime();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Test chime sound
                </button>
              </div>

              {/* Browser Notifications */}
              <div className="pt-3 border-t border-neutral-850 space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 cursor-pointer">
                  <div>
                    <div className="font-medium text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-400" />
                      Browser Desktop Notifications
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Receive alerts when in other tabs or minimized.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleNotificationToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-800 border-neutral-700 focus:ring-amber-400"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY TARGETS */}
          {activeTab === "goals" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="setting-daily-goal-hours" className="font-semibold text-white block">Daily Focus Target</label>
                <p className="text-[11px] text-neutral-400">
                  Target how many hours of deep work you aim for per day. Set to 0 if you prefer no daily goal.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="setting-daily-goal-hours"
                    type="number"
                    min="0"
                    max="14"
                    step="0.5"
                    value={settings.dailyGoalHours}
                    onChange={(e) => onUpdateSettings({ dailyGoalHours: Number(e.target.value) })}
                    className="w-28 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-neutral-400">hours / day</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1.5">
                <div className="text-white font-medium">Recommended focus ranges:</div>
                <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
                  <li>2.0 - 3.0 hours: Ideal for high cognitive load, software development, research</li>
                  <li>3.5 - 4.5 hours: Peak sustainable output for students and full-time knowledge workers</li>
                  <li>0 hours: Relaxed, unstructured journaling without goal pressure</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: DATA & PRIVACY */}
          {activeTab === "data" && (
            <div className="space-y-6">
              {/* Privacy statement (Section 46) */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-white">Local-First & Private</div>
                  <p className="text-[11px] text-neutral-400">
                    Your focus data stays on this device. No account is required. No task names or session journals are sent to third-party ad networks.
                  </p>
                </div>
              </div>

              {/* Demo Mode Toggle (Section 6) */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Sample / Demo Data</div>
                    <div className="text-[11px] text-neutral-400">
                      Populate realistic tasks, 14-day streak, 90-day heatmap, and analytics.
                    </div>
                  </div>
                  {settings.isDemoMode ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold">
                      DEMO ACTIVE
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onLoadDemoData}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Load Sample Data
                  </button>

                  {settings.isDemoMode && (
                    <button
                      onClick={onExitDemoData}
                      className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                    >
                      Exit Demo Mode
                    </button>
                  )}
                </div>
              </div>

              {/* Export & Import (Section 44, 64) */}
              <div className="space-y-3 pt-2">
                <div className="font-semibold text-white">Backup & Restore</div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onExportJson}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    Export JSON Backup
                  </button>

                  <button
                    onClick={onExportCsv}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Export CSV Spreadsheet
                  </button>

                  <label className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Import JSON Backup</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {importNotice && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      importNotice.isError
                        ? "bg-rose-950/20 border-rose-900 text-rose-300"
                        : "bg-emerald-950/20 border-emerald-900 text-emerald-300"
                    }`}
                  >
                    <span>{importNotice.message}</span>
                    <button onClick={() => setImportNotice(null)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Reset Data Danger Zone */}
              <div className="pt-3 border-t border-neutral-850 space-y-2">
                <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </div>
                <p className="text-[11px] text-neutral-400">
                  Permanently deletes all tasks, recorded sessions, and history stored locally.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
                      onClearAllData();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/50 text-rose-300 text-xs transition-colors"
                >
                  Clear all local data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
