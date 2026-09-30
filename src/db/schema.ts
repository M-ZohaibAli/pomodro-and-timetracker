import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  project: text("project").default("General"),
  estimatedPomodoros: integer("estimated_pomodoros").default(1),
  completedPomodoros: integer("completed_pomodoros").default(0),
  totalFocusSeconds: integer("total_focus_seconds").default(0),
  status: text("status").default("active"), // "active" | "completed" | "archived"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const focusSessionsTable = pgTable("focus_sessions", {
  id: text("id").primaryKey(),
  taskId: text("task_id"),
  taskTitle: text("task_title").notNull(),
  project: text("project").default("General"),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  sessionType: text("session_type").notNull(), // "focus" | "short_break" | "long_break"
  completed: boolean("completed").default(true).notNull(),
  interrupted: boolean("interrupted").default(false).notNull(),
  pauseDurationSeconds: integer("pause_duration_seconds").default(0).notNull(),
  isManual: boolean("is_manual").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const distractionsTable = pgTable("distractions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  category: text("category").notNull(), // "phone" | "social" | "browser" | "person" | "other"
  note: text("note"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const settingsTable = pgTable("user_settings", {
  id: text("id").primaryKey().default("default"),
  focusDurationMinutes: integer("focus_duration_minutes").default(25).notNull(),
  shortBreakMinutes: integer("short_break_minutes").default(5).notNull(),
  longBreakMinutes: integer("long_break_minutes").default(15).notNull(),
  sessionsBeforeLongBreak: integer("sessions_before_long_break").default(4).notNull(),
  autoStartBreaks: boolean("auto_start_breaks").default(false).notNull(),
  autoStartFocus: boolean("auto_start_focus").default(false).notNull(),
  dailyGoalHours: integer("daily_goal_hours").default(3).notNull(),
  ambientSound: text("ambient_sound").default("none").notNull(),
  ambientVolume: integer("ambient_volume").default(40).notNull(),
  chimeVolume: integer("chime_volume").default(70).notNull(),
  enableNotifications: boolean("enable_notifications").default(false).notNull(),
  hasCompletedTutorial: boolean("has_completed_tutorial").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
