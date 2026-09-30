export type SessionType = "focus" | "short_break" | "long_break";

export type DistractionCategory = "phone" | "social" | "browser" | "person" | "other";

export interface Task {
  id: string;
  title: string;
  project: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  totalFocusSeconds: number;
  status: "active" | "completed" | "archived";
  createdAt: string; // ISO string
  completedAt?: string | null;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string;
  project: string;
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  durationSeconds: number;
  sessionType: SessionType;
  completed: boolean;
  interrupted: boolean;
  pauseDurationSeconds: number;
  isManual: boolean;
  notes?: string;
}

export interface Distraction {
  id: string;
  sessionId?: string;
  category: DistractionCategory;
  note?: string;
  timestamp: string; // ISO string
}

export type PresetName = "classic" | "deep" | "sprint" | "custom";

export interface TimerSettings {
  preset: PresetName;
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export type AmbientSoundType = "none" | "rain" | "white_noise" | "brown_noise" | "fan";

export interface UserSettings extends TimerSettings {
  dailyGoalHours: number; // 0 for no goal
  ambientSound: AmbientSoundType;
  ambientVolume: number; // 0 to 100
  chimeVolume: number; // 0 to 100
  enableNotifications: boolean;
  hasCompletedTutorial: boolean;
  isDemoMode: boolean;
  theme?: "dark" | "system";
}

export type TimerStatus = "IDLE" | "FOCUSING" | "PAUSED" | "SHORT_BREAK" | "LONG_BREAK" | "COMPLETED";

export interface ActiveTimerSnapshot {
  sessionId: string;
  taskId: string | null;
  taskTitle: string;
  project: string;
  mode: SessionType;
  status: TimerStatus;
  targetEndTime: number; // ms timestamp
  totalDurationSeconds: number;
  remainingSeconds: number;
  sessionStartedAt: number; // ms timestamp
  accumulatedPauseMs: number;
  lastPauseTimestamp: number | null;
  cycleIndex: number; // e.g. 1, 2, 3, 4
}

export interface HeatmapDayData {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
  tasks: { title: string; seconds: number }[];
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface FocusScoreBreakdown {
  score: number; // 0 - 100
  completionRateScore: number; // max 30
  consistencyScore: number; // max 30
  interruptionScore: number; // max 20
  goalProgressScore: number; // max 20
  actualCompletionRate: number; // 0 - 100%
  activeDaysLastWeek: number; // e.g. 5/7
  interruptionCountLastWeek: number;
  todayGoalPercent: number; // 0 - 100%+
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  isActiveToday: boolean;
}

export interface TaskFilterOptions {
  status: "all" | "active" | "completed";
  project?: string;
  sortBy: "recentlyUsed" | "mostTime" | "created" | "title";
  searchQuery: string;
}

export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  settings: UserSettings;
  tasks: Task[];
  sessions: FocusSession[];
  distractions: Distraction[];
}
