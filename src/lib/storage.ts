import {
  Task,
  FocusSession,
  Distraction,
  UserSettings,
  ActiveTimerSnapshot,
  ExportDataPayload,
} from "@/types/focus";
import { generateDemoData } from "@/lib/demo-data";
import { getLocalDayString, formatDuration } from "@/lib/calculations";

const STORAGE_KEYS = {
  SCHEMA_VERSION: "focus_schema_version",
  TASKS: "focus_tasks_v1",
  SESSIONS: "focus_sessions_v1",
  DISTRACTIONS: "focus_distractions_v1",
  SETTINGS: "focus_settings_v1",
  ACTIVE_TIMER: "focus_active_timer_v1",
  IS_DEMO: "focus_is_demo_v1",
};

const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  preset: "classic",
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  dailyGoalHours: 3,
  ambientSound: "none",
  ambientVolume: 40,
  chimeVolume: 70,
  enableNotifications: false,
  hasCompletedTutorial: false,
  isDemoMode: false,
};

class FocusRepositoryClass {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private safeGet<T>(key: string, fallback: T): T {
    if (!this.isBrowser()) return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }

  private safeSet<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage quota full error
    }
  }

  public getSettings(): UserSettings {
    const stored = this.safeGet<Partial<UserSettings>>(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  public saveSettings(patch: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    this.safeSet(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  public getTasks(): Task[] {
    const tasks = this.safeGet<Task[]>(STORAGE_KEYS.TASKS, []);
    return Array.isArray(tasks) ? tasks : [];
  }

  public saveTask(task: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    this.safeSet(STORAGE_KEYS.TASKS, tasks);
  }

  public deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.safeSet(STORAGE_KEYS.TASKS, tasks);
  }

  public getSessions(): FocusSession[] {
    const sessions = this.safeGet<FocusSession[]>(STORAGE_KEYS.SESSIONS, []);
    return Array.isArray(sessions) ? sessions : [];
  }

  public saveSession(session: FocusSession): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    this.safeSet(STORAGE_KEYS.SESSIONS, sessions);

    // If attached to a task and this was a focus session, update task's stats
    if (session.taskId && session.sessionType === "focus") {
      const tasks = this.getTasks();
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) {
        task.totalFocusSeconds = (task.totalFocusSeconds || 0) + session.durationSeconds;
        if (session.completed) {
          task.completedPomodoros = (task.completedPomodoros || 0) + 1;
        }
        this.saveTask(task);
      }
    }
  }

  public deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.safeSet(STORAGE_KEYS.SESSIONS, sessions);
  }

  public getDistractions(): Distraction[] {
    const distractions = this.safeGet<Distraction[]>(STORAGE_KEYS.DISTRACTIONS, []);
    return Array.isArray(distractions) ? distractions : [];
  }

  public saveDistraction(distraction: Distraction): void {
    const distractions = this.getDistractions();
    distractions.unshift(distraction);
    this.safeSet(STORAGE_KEYS.DISTRACTIONS, distractions);
  }

  public getActiveTimerSnapshot(): ActiveTimerSnapshot | null {
    return this.safeGet<ActiveTimerSnapshot | null>(STORAGE_KEYS.ACTIVE_TIMER, null);
  }

  public saveActiveTimerSnapshot(snapshot: ActiveTimerSnapshot | null): void {
    if (snapshot === null) {
      if (this.isBrowser()) {
        try {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
        } catch {
          // ignore
        }
      }
    } else {
      this.safeSet(STORAGE_KEYS.ACTIVE_TIMER, snapshot);
    }
  }

  public loadDemoData(): void {
    const demo = generateDemoData();
    this.safeSet(STORAGE_KEYS.TASKS, demo.tasks);
    this.safeSet(STORAGE_KEYS.SESSIONS, demo.sessions);
    this.safeSet(STORAGE_KEYS.DISTRACTIONS, demo.distractions);
    this.safeSet(STORAGE_KEYS.SETTINGS, demo.settings);
    this.saveActiveTimerSnapshot(null);
  }

  public exitDemo(): void {
    this.clearAllData();
  }

  public clearAllData(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.DISTRACTIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
      const settings = this.getSettings();
      settings.isDemoMode = false;
      this.saveSettings(settings);
    } catch {
      // ignore
    }
  }

  public exportJson(): string {
    const payload: ExportDataPayload = {
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      distractions: this.getDistractions(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public exportCsv(timeframe: "all" | "week" | "month" = "all"): string {
    let sessions = this.getSessions();
    const now = new Date();

    if (timeframe === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const cutoff = getLocalDayString(weekAgo);
      sessions = sessions.filter((s) => getLocalDayString(s.startedAt) >= cutoff);
    } else if (timeframe === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      const cutoff = getLocalDayString(monthAgo);
      sessions = sessions.filter((s) => getLocalDayString(s.startedAt) >= cutoff);
    }

    const headers = [
      "date",
      "task",
      "project",
      "start",
      "end",
      "duration_seconds",
      "duration_formatted",
      "session_type",
      "completed",
      "interrupted",
      "manual",
      "notes",
    ];

    const rows = sessions.map((s) => {
      const date = getLocalDayString(s.startedAt);
      const task = `"${(s.taskTitle || "Focus").replace(/"/g, '""')}"`;
      const project = `"${(s.project || "General").replace(/"/g, '""')}"`;
      const start = s.startedAt;
      const end = s.endedAt;
      const durSec = s.durationSeconds;
      const durFmt = `"${formatDuration(durSec)}"`;
      const type = s.sessionType;
      const completed = s.completed ? "yes" : "no";
      const interrupted = s.interrupted ? "yes" : "no";
      const manual = s.isManual ? "yes" : "no";
      const notes = `"${(s.notes || "").replace(/"/g, '""')}"`;

      return [
        date,
        task,
        project,
        start,
        end,
        durSec,
        durFmt,
        type,
        completed,
        interrupted,
        manual,
        notes,
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  public validateAndImportJson(jsonStr: string): {
    success: boolean;
    error?: string;
    taskCount?: number;
    sessionCount?: number;
  } {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<ExportDataPayload>;
      if (!parsed || typeof parsed !== "object") {
        return { success: false, error: "Invalid backup format: root must be an object." };
      }

      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
      const distractions = Array.isArray(parsed.distractions) ? parsed.distractions : [];
      const settings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};

      // Validate items have necessary minimum fields
      for (const t of tasks) {
        if (!t.id || typeof t.title !== "string") {
          return { success: false, error: "Validation failed: Task missing id or title." };
        }
      }

      for (const s of sessions) {
        if (!s.id || typeof s.durationSeconds !== "number" || !s.startedAt) {
          return { success: false, error: "Validation failed: Session missing id, duration, or date." };
        }
      }

      // Safe save
      this.safeSet(STORAGE_KEYS.TASKS, tasks);
      this.safeSet(STORAGE_KEYS.SESSIONS, sessions);
      this.safeSet(STORAGE_KEYS.DISTRACTIONS, distractions);
      this.saveSettings(settings);
      this.saveActiveTimerSnapshot(null);

      return {
        success: true,
        taskCount: tasks.length,
        sessionCount: sessions.length,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Malformed JSON syntax.",
      };
    }
  }
}

export const FocusRepository = new FocusRepositoryClass();
