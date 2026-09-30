"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Task,
  FocusSession,
  Distraction,
  UserSettings,
  TimerStatus,
  SessionType,
  DistractionCategory,
  AmbientSoundType,
} from "@/types/focus";
import { FocusRepository, DEFAULT_SETTINGS } from "@/lib/storage";
import { audioEngine } from "@/lib/audio";
import { sendBrowserNotification } from "@/lib/notifications";
import { Header } from "@/components/common/Header";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { FocusModeOverlay } from "@/components/timer/FocusModeOverlay";
import { TaskList } from "@/components/tasks/TaskList";
import { HistoryView } from "@/components/history/HistoryView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { ShortcutsModal } from "@/components/common/ShortcutsModal";
import { InteractiveTutorial } from "@/components/tutorial/InteractiveTutorial";
import { DistractionModal } from "@/components/timer/DistractionModal";
import { TaskSwitchModal } from "@/components/timer/TaskSwitchModal";
import { calculateDailyFocus } from "@/lib/calculations";

export default function FocusApp() {
  // App navigation state
  const [currentTab, setCurrentTab] = useState<"timer" | "tasks" | "history" | "analytics">("timer");

  // Repository state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Selected task state
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [quickTaskInput, setQuickTaskInput] = useState("");

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [pendingTaskSwitch, setPendingTaskSwitch] = useState<Task | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Active Timer Engine State
  const [status, setStatus] = useState<TimerStatus>("IDLE");
  const [mode, setMode] = useState<SessionType>("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(25 * 60);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [accumulatedPauseMs, setAccumulatedPauseMs] = useState(0);
  const [lastPauseTimestamp, setLastPauseTimestamp] = useState<number | null>(null);
  const [cycleIndex, setCycleIndex] = useState(1);

  // Refs for current values in callbacks
  const statusRef = useRef(status);
  statusRef.current = status;
  const targetEndTimeRef = useRef(targetEndTime);
  targetEndTimeRef.current = targetEndTime;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const remainingSecondsRef = useRef(remainingSeconds);
  remainingSecondsRef.current = remainingSeconds;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const sessionStartedAtRef = useRef(sessionStartedAt);
  sessionStartedAtRef.current = sessionStartedAt;
  const accumulatedPauseMsRef = useRef(accumulatedPauseMs);
  accumulatedPauseMsRef.current = accumulatedPauseMs;
  const currentTaskIdRef = useRef(currentTaskId);
  currentTaskIdRef.current = currentTaskId;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const quickTaskInputRef = useRef(quickTaskInput);
  quickTaskInputRef.current = quickTaskInput;
  const cycleIndexRef = useRef(cycleIndex);
  cycleIndexRef.current = cycleIndex;

  // Initialize data from repository on mount
  useEffect(() => {
    const loadedSettings = FocusRepository.getSettings();
    const loadedTasks = FocusRepository.getTasks();
    const loadedSessions = FocusRepository.getSessions();
    const loadedDistractions = FocusRepository.getDistractions();
    const snapshot = FocusRepository.getActiveTimerSnapshot();

    setSettings(loadedSettings);
    setTasks(loadedTasks);
    setSessions(loadedSessions);
    setDistractions(loadedDistractions);

    // Initial default remaining seconds based on settings
    const defaultSec = (loadedSettings.focusDurationMinutes || 25) * 60;
    setRemainingSeconds(defaultSec);
    setTotalDurationSeconds(defaultSec);

    // Audio initial volumes
    audioEngine.setAmbientVolume(loadedSettings.ambientVolume ?? 40);
    audioEngine.setChimeVolume(loadedSettings.chimeVolume ?? 70);

    // Restore active timer snapshot if existed
    if (snapshot) {
      if (snapshot.status === "FOCUSING" || snapshot.status === "SHORT_BREAK" || snapshot.status === "LONG_BREAK") {
        const now = Date.now();
        if (now < snapshot.targetEndTime) {
          // Timer still running!
          setStatus(snapshot.status);
          setMode(snapshot.mode);
          setTargetEndTime(snapshot.targetEndTime);
          setTotalDurationSeconds(snapshot.totalDurationSeconds);
          setSessionStartedAt(snapshot.sessionStartedAt);
          setAccumulatedPauseMs(snapshot.accumulatedPauseMs);
          setLastPauseTimestamp(snapshot.lastPauseTimestamp);
          setCycleIndex(snapshot.cycleIndex);
          setCurrentTaskId(snapshot.taskId);
          setQuickTaskInput(snapshot.taskTitle);
          setRemainingSeconds(Math.max(0, Math.ceil((snapshot.targetEndTime - now) / 1000)));

          if (loadedSettings.ambientSound !== "none") {
            audioEngine.playAmbient(loadedSettings.ambientSound);
          }
        } else {
          // Timer finished while page was closed! Reconcile session.
          const finishedSession: FocusSession = {
            id: snapshot.sessionId,
            taskId: snapshot.taskId,
            taskTitle: snapshot.taskTitle,
            project: snapshot.project,
            startedAt: new Date(snapshot.sessionStartedAt).toISOString(),
            endedAt: new Date(snapshot.targetEndTime).toISOString(),
            durationSeconds: snapshot.totalDurationSeconds,
            sessionType: snapshot.mode,
            completed: true,
            interrupted: false,
            pauseDurationSeconds: Math.round(snapshot.accumulatedPauseMs / 1000),
            isManual: false,
          };
          FocusRepository.saveSession(finishedSession);
          FocusRepository.saveActiveTimerSnapshot(null);
          setSessions(FocusRepository.getSessions());
          setTasks(FocusRepository.getTasks());
          setStatus("COMPLETED");
          setMode(snapshot.mode);
          setRemainingSeconds(0);
        }
      } else if (snapshot.status === "PAUSED") {
        setStatus("PAUSED");
        setMode(snapshot.mode);
        setTotalDurationSeconds(snapshot.totalDurationSeconds);
        setRemainingSeconds(snapshot.remainingSeconds);
        setSessionStartedAt(snapshot.sessionStartedAt);
        setAccumulatedPauseMs(snapshot.accumulatedPauseMs);
        setLastPauseTimestamp(snapshot.lastPauseTimestamp);
        setCycleIndex(snapshot.cycleIndex);
        setCurrentTaskId(snapshot.taskId);
        setQuickTaskInput(snapshot.taskTitle);
      }
    }

    // Auto open tutorial for first time users
    if (!loadedSettings.hasCompletedTutorial && loadedSessions.length === 0 && loadedTasks.length === 0) {
      setShowTutorial(true);
    }

    setIsLoaded(true);
  }, []);

  // Save active snapshot to localStorage
  const persistActiveTimer = useCallback(() => {
    if (statusRef.current === "FOCUSING" || statusRef.current === "PAUSED" || statusRef.current === "SHORT_BREAK" || statusRef.current === "LONG_BREAK") {
      const activeTask = tasksRef.current.find((t) => t.id === currentTaskIdRef.current);
      FocusRepository.saveActiveTimerSnapshot({
        sessionId: `sess-${sessionStartedAtRef.current || Date.now()}`,
        taskId: currentTaskIdRef.current,
        taskTitle: activeTask?.title || quickTaskInputRef.current.trim() || "Focus Session",
        project: activeTask?.project || "General",
        mode: modeRef.current,
        status: statusRef.current,
        targetEndTime: targetEndTimeRef.current || Date.now(),
        totalDurationSeconds: totalDurationSeconds,
        remainingSeconds: remainingSecondsRef.current,
        sessionStartedAt: sessionStartedAtRef.current || Date.now(),
        accumulatedPauseMs: accumulatedPauseMsRef.current,
        lastPauseTimestamp: lastPauseTimestamp,
        cycleIndex: cycleIndexRef.current,
      });
    } else {
      FocusRepository.saveActiveTimerSnapshot(null);
    }
  }, [totalDurationSeconds, lastPauseTimestamp]);

  // Complete session logic (handles focus or break expiry)
  const completeSession = useCallback(
    (isSkip = false) => {
      audioEngine.stopAmbient();
      const currentMode = modeRef.current;
      const startedAt = sessionStartedAtRef.current || Date.now();
      const endedAt = Date.now();
      const activeTask = tasksRef.current.find((t) => t.id === currentTaskIdRef.current);
      const taskTitle = activeTask?.title || quickTaskInputRef.current.trim() || "Focus Session";
      const project = activeTask?.project || "General";

      if (currentMode === "focus") {
        audioEngine.playSessionCompleteChime();
        sendBrowserNotification("Focus session complete!", {
          body: `Great job on "${taskTitle}". Ready for a restorative break?`,
        });

        // Record focus session
        const actualDurationSec = Math.max(
          1,
          Math.min(totalDurationSeconds, Math.round((endedAt - startedAt - accumulatedPauseMsRef.current) / 1000))
        );

        const newSession: FocusSession = {
          id: `sess-${Date.now()}`,
          taskId: currentTaskIdRef.current,
          taskTitle,
          project,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          durationSeconds: isSkip ? actualDurationSec : totalDurationSeconds,
          sessionType: "focus",
          completed: !isSkip,
          interrupted: isSkip,
          pauseDurationSeconds: Math.round(accumulatedPauseMsRef.current / 1000),
          isManual: false,
        };

        FocusRepository.saveSession(newSession);
        setSessions(FocusRepository.getSessions());
        setTasks(FocusRepository.getTasks());

        // Async sync to server database
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSession),
        }).catch(() => {});

        FocusRepository.saveActiveTimerSnapshot(null);

        const nextCycle = cycleIndexRef.current + 1;
        setCycleIndex(nextCycle);

        // Auto-start breaks if enabled
        if (settingsRef.current.autoStartBreaks) {
          const isLong = nextCycle > settingsRef.current.sessionsBeforeLongBreak;
          startBreak(isLong ? "long_break" : "short_break");
        } else {
          setStatus("COMPLETED");
          setRemainingSeconds(0);
        }
      } else {
        // Break complete
        audioEngine.playBreakCompleteChime();
        sendBrowserNotification("Break complete!", {
          body: "Ready to jump back into your next focus sprint?",
        });

        FocusRepository.saveActiveTimerSnapshot(null);

        if (settingsRef.current.autoStartFocus) {
          startFocus();
        } else {
          setStatus("IDLE");
          setMode("focus");
          const defaultSec = settingsRef.current.focusDurationMinutes * 60;
          setRemainingSeconds(defaultSec);
          setTotalDurationSeconds(defaultSec);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalDurationSeconds]
  );

  // Timer interval ticker (250ms interval for precision)
  useEffect(() => {
    if (status !== "FOCUSING" && status !== "SHORT_BREAK" && status !== "LONG_BREAK") {
      return;
    }

    const interval = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;

      if (diffMs <= 0) {
        setRemainingSeconds(0);
        clearInterval(interval);
        completeSession(false);
      } else {
        const remaining = Math.ceil(diffMs / 1000);
        setRemainingSeconds(remaining);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [status, completeSession]);

  // Page visibility & sleep reconciliation (Section 10, 50, 85, 86)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (targetEndTimeRef.current && (statusRef.current === "FOCUSING" || statusRef.current === "SHORT_BREAK" || statusRef.current === "LONG_BREAK")) {
          const now = Date.now();
          if (now >= targetEndTimeRef.current) {
            completeSession(false);
          } else {
            setRemainingSeconds(Math.ceil((targetEndTimeRef.current - now) / 1000));
          }
        }
      }
      persistActiveTimer();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", persistActiveTimer);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", persistActiveTimer);
    };
  }, [completeSession, persistActiveTimer]);

  // Start Focus Session
  const startFocus = () => {
    const duration = settings.focusDurationMinutes * 60;
    const now = Date.now();
    const end = now + duration * 1000;

    setMode("focus");
    setStatus("FOCUSING");
    setTotalDurationSeconds(duration);
    setRemainingSeconds(duration);
    setTargetEndTime(end);
    setSessionStartedAt(now);
    setAccumulatedPauseMs(0);
    setLastPauseTimestamp(null);

    if (settings.ambientSound !== "none" && !isMuted) {
      audioEngine.playAmbient(settings.ambientSound);
    }
  };

  // Start Break Session
  const startBreak = (breakType: "short_break" | "long_break") => {
    audioEngine.stopAmbient();
    const minutes =
      breakType === "short_break" ? settings.shortBreakMinutes : settings.longBreakMinutes;
    const duration = minutes * 60;
    const now = Date.now();
    const end = now + duration * 1000;

    setMode(breakType);
    setStatus(breakType === "short_break" ? "SHORT_BREAK" : "LONG_BREAK");
    setTotalDurationSeconds(duration);
    setRemainingSeconds(duration);
    setTargetEndTime(end);
    setSessionStartedAt(now);
    setAccumulatedPauseMs(0);
    setLastPauseTimestamp(null);
  };

  // Pause
  const handlePause = () => {
    if (status !== "FOCUSING" && status !== "SHORT_BREAK" && status !== "LONG_BREAK") return;
    audioEngine.stopAmbient();
    setStatus("PAUSED");
    setLastPauseTimestamp(Date.now());
  };

  // Resume
  const handleResume = () => {
    if (status !== "PAUSED" || remainingSeconds <= 0) return;
    const now = Date.now();
    const pauseDelta = lastPauseTimestamp ? now - lastPauseTimestamp : 0;
    const newAccumulated = accumulatedPauseMs + pauseDelta;
    const newTarget = now + remainingSeconds * 1000;

    setAccumulatedPauseMs(newAccumulated);
    setTargetEndTime(newTarget);
    setLastPauseTimestamp(null);

    if (mode === "focus") {
      setStatus("FOCUSING");
      if (settings.ambientSound !== "none" && !isMuted) {
        audioEngine.playAmbient(settings.ambientSound);
      }
    } else if (mode === "short_break") {
      setStatus("SHORT_BREAK");
    } else {
      setStatus("LONG_BREAK");
    }
  };

  // Skip / cancel
  const handleSkip = () => {
    completeSession(true);
  };

  // Reset to idle
  const handleReset = () => {
    audioEngine.stopAmbient();
    FocusRepository.saveActiveTimerSnapshot(null);
    setStatus("IDLE");
    setMode("focus");
    const defaultSec = settings.focusDurationMinutes * 60;
    setRemainingSeconds(defaultSec);
    setTotalDurationSeconds(defaultSec);
    setTargetEndTime(null);
    setSessionStartedAt(null);
    setAccumulatedPauseMs(0);
  };

  // Finish early (saves completed time to date)
  const handleFinishEarly = () => {
    completeSession(false);
  };

  // Add minutes (+1m or +5m)
  const handleAddMinutes = (minutes: number) => {
    const addMs = minutes * 60 * 1000;
    setRemainingSeconds((prev) => prev + minutes * 60);
    setTotalDurationSeconds((prev) => prev + minutes * 60);
    if (targetEndTime) {
      setTargetEndTime(targetEndTime + addMs);
    }
  };

  // Task selection & switching logic (Section 15)
  const handleSelectTask = (task: Task | null) => {
    if (status === "FOCUSING" || status === "PAUSED") {
      // Active timer running! Must prompt explicitly
      setPendingTaskSwitch(task);
    } else {
      // Idle or completed: direct switch
      setCurrentTaskId(task ? task.id : null);
      if (task) {
        setQuickTaskInput(task.title);
      }
    }
  };

  const handleTaskSwitchChoice = (choice: "split_keep" | "reassign_continue" | "stop_save") => {
    const activeTask = tasks.find((t) => t.id === currentTaskId);
    const oldTitle = activeTask?.title || quickTaskInput || "Focus Session";
    const oldProject = activeTask?.project || "General";
    const elapsedSec = Math.max(0, totalDurationSeconds - remainingSeconds);

    if (choice === "split_keep") {
      // Save elapsed time to old task
      if (elapsedSec > 30) {
        const partialSession: FocusSession = {
          id: `sess-${Date.now()}`,
          taskId: currentTaskId,
          taskTitle: oldTitle,
          project: oldProject,
          startedAt: new Date(sessionStartedAt || Date.now()).toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds: elapsedSec,
          sessionType: "focus",
          completed: false,
          interrupted: false,
          pauseDurationSeconds: Math.round(accumulatedPauseMs / 1000),
          isManual: false,
        };
        FocusRepository.saveSession(partialSession);
        setSessions(FocusRepository.getSessions());
        setTasks(FocusRepository.getTasks());
      }
      // Re-anchor to new task
      setCurrentTaskId(pendingTaskSwitch ? pendingTaskSwitch.id : null);
      setQuickTaskInput(pendingTaskSwitch ? pendingTaskSwitch.title : "");
      startFocus();
    } else if (choice === "reassign_continue") {
      // Reassign whole running session to new task
      setCurrentTaskId(pendingTaskSwitch ? pendingTaskSwitch.id : null);
      setQuickTaskInput(pendingTaskSwitch ? pendingTaskSwitch.title : "");
    } else if (choice === "stop_save") {
      // Stop session and save
      completeSession(false);
      setCurrentTaskId(pendingTaskSwitch ? pendingTaskSwitch.id : null);
      setQuickTaskInput(pendingTaskSwitch ? pendingTaskSwitch.title : "");
      handleReset();
    }
    setPendingTaskSwitch(null);
  };

  // Add Task
  const handleAddTask = (title: string, project: string, estimatedPomodoros: number) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      project: project || "General",
      estimatedPomodoros: Math.max(1, estimatedPomodoros || 1),
      completedPomodoros: 0,
      totalFocusSeconds: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    FocusRepository.saveTask(newTask);
    setTasks(FocusRepository.getTasks());

    // Async sync to database
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    }).catch(() => {});
  };

  // Toggle complete task
  const handleToggleTaskComplete = (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    const isCompleted = t.status === "completed";
    const updated: Task = {
      ...t,
      status: isCompleted ? "active" : "completed",
      completedAt: isCompleted ? null : new Date().toISOString(),
    };
    FocusRepository.saveTask(updated);
    setTasks(FocusRepository.getTasks());
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    FocusRepository.deleteTask(taskId);
    setTasks(FocusRepository.getTasks());
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
    }
  };

  // Add manual session
  const handleAddManualSession = (
    taskTitle: string,
    project: string,
    durationMinutes: number,
    dateStr: string,
    notes?: string
  ) => {
    const durationSeconds = durationMinutes * 60;
    const matchedTask = tasks.find((t) => t.title.toLowerCase() === taskTitle.toLowerCase());
    const start = new Date(`${dateStr}T10:00:00`);
    const end = new Date(start.getTime() + durationSeconds * 1000);

    const manualSession: FocusSession = {
      id: `manual-${Date.now()}`,
      taskId: matchedTask ? matchedTask.id : null,
      taskTitle,
      project: project || (matchedTask ? matchedTask.project : "General"),
      startedAt: start.toISOString(),
      endedAt: end.toISOString(),
      durationSeconds,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: true,
      notes,
    };

    FocusRepository.saveSession(manualSession);
    setSessions(FocusRepository.getSessions());
    setTasks(FocusRepository.getTasks());

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualSession),
    }).catch(() => {});
  };

  // Delete session
  const handleDeleteSession = (sessionId: string) => {
    FocusRepository.deleteSession(sessionId);
    setSessions(FocusRepository.getSessions());
  };

  // Log distraction
  const handleLogDistraction = (category: DistractionCategory, note?: string) => {
    const d: Distraction = {
      id: `dist-${Date.now()}`,
      sessionId: `sess-${sessionStartedAt || Date.now()}`,
      category,
      note,
      timestamp: new Date().toISOString(),
    };
    FocusRepository.saveDistraction(d);
    setDistractions(FocusRepository.getDistractions());
  };

  // Update Settings
  const handleUpdateSettings = (patch: Partial<UserSettings>) => {
    const updated = FocusRepository.saveSettings(patch);
    setSettings(updated);

    if (patch.ambientVolume !== undefined) {
      audioEngine.setAmbientVolume(patch.ambientVolume);
    }
    if (patch.chimeVolume !== undefined) {
      audioEngine.setChimeVolume(patch.chimeVolume);
    }
    if (status === "IDLE" && patch.focusDurationMinutes !== undefined) {
      const newSec = patch.focusDurationMinutes * 60;
      setRemainingSeconds(newSec);
      setTotalDurationSeconds(newSec);
    }
  };

  // Demo data handlers (Section 6)
  const handleLoadDemoData = () => {
    FocusRepository.loadDemoData();
    setTasks(FocusRepository.getTasks());
    setSessions(FocusRepository.getSessions());
    setDistractions(FocusRepository.getDistractions());
    setSettings(FocusRepository.getSettings());
    setCurrentTaskId("demo-task-1");
    setQuickTaskInput("Build portfolio website");
    handleReset();
  };

  const handleExitDemo = () => {
    FocusRepository.exitDemo();
    setTasks(FocusRepository.getTasks());
    setSessions(FocusRepository.getSessions());
    setDistractions(FocusRepository.getDistractions());
    setSettings(FocusRepository.getSettings());
    setCurrentTaskId(null);
    setQuickTaskInput("");
    handleReset();
  };

  const handleClearAllData = () => {
    FocusRepository.clearAllData();
    setTasks([]);
    setSessions([]);
    setDistractions([]);
    setSettings(FocusRepository.getSettings());
    setCurrentTaskId(null);
    setQuickTaskInput("");
    handleReset();
  };

  // Export handlers (Section 44)
  const handleExportCsv = (tf: "all" | "week" | "month" = "all") => {
    const csvContent = FocusRepository.exportCsv(tf);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focus_sessions_${tf}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonContent = FocusRepository.exportJson();
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focus_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (jsonStr: string) => {
    const res = FocusRepository.validateAndImportJson(jsonStr);
    if (res.success) {
      setTasks(FocusRepository.getTasks());
      setSessions(FocusRepository.getSessions());
      setDistractions(FocusRepository.getDistractions());
      setSettings(FocusRepository.getSettings());
      handleReset();
    }
    return res;
  };

  // Global Keyboard Shortcuts (Section 60)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }

      if (e.key === " " && !showFocusMode) {
        e.preventDefault();
        if (statusRef.current === "IDLE") {
          startFocus();
        } else if (statusRef.current === "FOCUSING" || statusRef.current === "SHORT_BREAK" || statusRef.current === "LONG_BREAK") {
          handlePause();
        } else if (statusRef.current === "PAUSED") {
          handleResume();
        }
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowFocusMode((prev) => !prev);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCurrentTab("tasks");
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsMuted((prev) => {
          const next = !prev;
          audioEngine.setMuted(next);
          return next;
        });
      } else if (e.key === "Escape") {
        setShowSettings(false);
        setShowShortcuts(false);
        setShowTutorial(false);
        setShowDistractionModal(false);
        setShowFocusMode(false);
        setPendingTaskSwitch(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFocusMode, status, remainingSeconds]);

  const activeTask = tasks.find((t) => t.id === currentTaskId) || null;
  const todayStats = calculateDailyFocus(sessions);
  const isFirstUse = tasks.length === 0 && sessions.length === 0 && !settings.isDemoMode;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-400 selection:text-neutral-950">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenTutorial={() => setShowTutorial(true)}
        isDemoMode={settings.isDemoMode}
        onExitDemo={handleExitDemo}
        ambientSound={settings.ambientSound}
        ambientVolume={settings.ambientVolume}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          audioEngine.setMuted(!isMuted);
        }}
        onChangeAmbientSound={(soundType) => {
          handleUpdateSettings({ ambientSound: soundType });
          if (status === "FOCUSING" && !isMuted) {
            audioEngine.playAmbient(soundType);
          }
        }}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {currentTab === "timer" && (
          <TimerDisplay
            status={status}
            mode={mode}
            remainingSeconds={remainingSeconds}
            totalDurationSeconds={totalDurationSeconds}
            currentTask={activeTask}
            tasks={tasks}
            quickTaskInput={quickTaskInput}
            onChangeQuickTaskInput={setQuickTaskInput}
            onSelectTask={handleSelectTask}
            onStart={startFocus}
            onPause={handlePause}
            onResume={handleResume}
            onSkip={handleSkip}
            onFinishEarly={handleFinishEarly}
            onReset={handleReset}
            onAddMinutes={handleAddMinutes}
            onStartBreak={startBreak}
            onStartNextFocus={startFocus}
            onOpenFocusMode={() => setShowFocusMode(true)}
            onOpenDistractionModal={() => setShowDistractionModal(true)}
            onOpenTutorial={() => setShowTutorial(true)}
            onLoadDemoData={handleLoadDemoData}
            cycleIndex={cycleIndex}
            maxCycles={settings.sessionsBeforeLongBreak}
            todayFocusSeconds={todayStats.totalSeconds}
            todaySessionCount={todayStats.sessionsCount}
            todayCompletedCount={todayStats.completedCount}
            settings={settings}
            isFirstUse={isFirstUse}
          />
        )}

        {currentTab === "tasks" && (
          <TaskList
            tasks={tasks}
            sessions={sessions}
            activeTaskId={currentTaskId}
            onSelectTask={handleSelectTask}
            onStartWithTask={(task) => {
              handleSelectTask(task);
              setCurrentTab("timer");
              if (status === "IDLE") {
                startFocus();
              }
            }}
            onAddTask={handleAddTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentTab === "history" && (
          <HistoryView
            sessions={sessions}
            tasks={tasks}
            onAddManualSession={handleAddManualSession}
            onDeleteSession={handleDeleteSession}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        )}

        {currentTab === "analytics" && (
          <AnalyticsView sessions={sessions} distractions={distractions} settings={settings} />
        )}
      </main>

      {/* Modals & Overlays */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onLoadDemoData={handleLoadDemoData}
        onExitDemoData={handleExitDemo}
        onClearAllData={handleClearAllData}
        onExportCsv={() => handleExportCsv("all")}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <InteractiveTutorial
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          handleUpdateSettings({ hasCompletedTutorial: true });
        }}
        onStartFocus={() => {
          setCurrentTab("timer");
          startFocus();
        }}
      />

      <DistractionModal
        isOpen={showDistractionModal}
        onClose={() => setShowDistractionModal(false)}
        onLog={handleLogDistraction}
      />

      <TaskSwitchModal
        isOpen={pendingTaskSwitch !== null}
        elapsedSeconds={Math.max(0, totalDurationSeconds - remainingSeconds)}
        currentTaskTitle={activeTask?.title || quickTaskInput || "Focus Session"}
        newTask={pendingTaskSwitch}
        onClose={() => setPendingTaskSwitch(null)}
        onChoice={handleTaskSwitchChoice}
      />

      <FocusModeOverlay
        isOpen={showFocusMode}
        onClose={() => setShowFocusMode(false)}
        status={status}
        mode={mode}
        taskTitle={activeTask?.title || quickTaskInput || "Focus Session"}
        project={activeTask?.project || "General"}
        remainingSeconds={remainingSeconds}
        totalDurationSeconds={totalDurationSeconds}
        cycleIndex={cycleIndex}
        maxCycles={settings.sessionsBeforeLongBreak}
        ambientSound={settings.ambientSound}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          audioEngine.setMuted(!isMuted);
        }}
        onPause={handlePause}
        onResume={handleResume}
        onFinishEarly={handleFinishEarly}
        onAddOneMinute={() => handleAddMinutes(1)}
        onOpenDistractionModal={() => setShowDistractionModal(true)}
      />
    </div>
  );
}
