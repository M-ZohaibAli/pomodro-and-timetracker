import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTimeRemaining,
  formatDuration,
  getLocalDayString,
  calculateDailyFocus,
  calculateWeeklyFocus,
  calculatePeriodFocus,
  calculateStreak,
  calculateFocusScore,
  calculateHeatmapData,
} from "../src/lib/calculations.ts";

test("formatTimeRemaining formats mm:ss and hh:mm:ss correctly", () => {
  assert.equal(formatTimeRemaining(1500), "25:00");
  assert.equal(formatTimeRemaining(5), "00:05");
  assert.equal(formatTimeRemaining(65), "01:05");
  assert.equal(formatTimeRemaining(3665), "1:01:05");
});

test("formatDuration formats human-readable durations", () => {
  assert.equal(formatDuration(1500), "25m");
  assert.equal(formatDuration(3600), "1h");
  assert.equal(formatDuration(4500), "1h 15m");
  assert.equal(formatDuration(0), "0m");
  assert.equal(formatDuration(30), "30s");
});

test("getLocalDayString produces YYYY-MM-DD", () => {
  const d = new Date(2026, 2, 15); // March 15, 2026
  assert.equal(getLocalDayString(d), "2026-03-15");
});

test("calculateDailyFocus summarizes tasks and totals", () => {
  const today = getLocalDayString();
  const sessions = [
    {
      id: "s1",
      taskId: "t1",
      taskTitle: "Build app",
      project: "Coding",
      startedAt: `${today}T10:00:00.000Z`,
      endedAt: `${today}T10:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
    {
      id: "s2",
      taskId: "t1",
      taskTitle: "Build app",
      project: "Coding",
      startedAt: `${today}T11:00:00.000Z`,
      endedAt: `${today}T11:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
    {
      id: "s3",
      taskId: null,
      taskTitle: "Rest",
      project: "General",
      startedAt: `${today}T11:25:00.000Z`,
      endedAt: `${today}T11:30:00.000Z`,
      durationSeconds: 300,
      sessionType: "short_break", // should be excluded from focus time
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
  ];

  const daily = calculateDailyFocus(sessions, today);
  assert.equal(daily.totalSeconds, 3000);
  assert.equal(daily.sessionsCount, 2);
  assert.equal(daily.completedCount, 2);
  assert.equal(daily.tasksBreakdown.length, 1);
  assert.equal(daily.tasksBreakdown[0].title, "Build app");
  assert.equal(daily.tasksBreakdown[0].seconds, 3000);
});

test("calculateStreak counts consecutive focus days accurately", () => {
  const now = new Date();
  const today = getLocalDayString(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yStr = getLocalDayString(yesterday);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const twoStr = getLocalDayString(twoDaysAgo);

  const sessions = [
    {
      id: "1",
      taskId: "t",
      taskTitle: "T",
      project: "P",
      startedAt: `${twoStr}T10:00:00.000Z`,
      endedAt: `${twoStr}T10:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
    {
      id: "2",
      taskId: "t",
      taskTitle: "T",
      project: "P",
      startedAt: `${yStr}T10:00:00.000Z`,
      endedAt: `${yStr}T10:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
    {
      id: "3",
      taskId: "t",
      taskTitle: "T",
      project: "P",
      startedAt: `${today}T10:00:00.000Z`,
      endedAt: `${today}T10:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
  ];

  const streak = calculateStreak(sessions);
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.bestStreak, 3);
  assert.equal(streak.isActiveToday, true);
});

test("calculateFocusScore returns deterministic score 0-100", () => {
  const now = new Date();
  const today = getLocalDayString(now);

  const sessions = [
    {
      id: "1",
      taskId: "t",
      taskTitle: "T",
      project: "P",
      startedAt: `${today}T10:00:00.000Z`,
      endedAt: `${today}T10:25:00.000Z`,
      durationSeconds: 1500,
      sessionType: "focus",
      completed: true,
      interrupted: false,
      pauseDurationSeconds: 0,
      isManual: false,
    },
  ];

  const score = calculateFocusScore(sessions, [], 1);
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.ok(score.completionRateScore <= 30);
  assert.ok(score.consistencyScore <= 30);
  assert.ok(score.interruptionScore <= 20);
  assert.ok(score.goalProgressScore <= 20);
});

test("calculateHeatmapData returns correct number of days with intensity levels", () => {
  const data = calculateHeatmapData([], 30);
  assert.equal(data.length, 30);
  assert.equal(data[0].intensity, 0);
  assert.equal(data[0].totalSeconds, 0);
});
