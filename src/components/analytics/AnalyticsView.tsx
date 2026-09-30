"use client";

import React, { useState } from "react";
import { FocusSession, Distraction, UserSettings } from "@/types/focus";
import {
  calculateDailyFocus,
  calculateWeeklyFocus,
  calculatePeriodFocus,
  calculateStreak,
  calculateFocusScore,
  calculateHeatmapData,
  formatDuration,
} from "@/lib/calculations";
import { CalendarHeatmap } from "./CalendarHeatmap";
import {
  Flame,
  Award,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  X,
  Smartphone,
  Globe,
  UserX,
} from "lucide-react";

interface AnalyticsViewProps {
  sessions: FocusSession[];
  distractions: Distraction[];
  settings: UserSettings;
}

type Timeframe = "today" | "7d" | "30d" | "90d";

export function AnalyticsView({ sessions, distractions, settings }: AnalyticsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);

  const streak = calculateStreak(sessions);
  const focusScore = calculateFocusScore(sessions, distractions, settings.dailyGoalHours);
  const heatmapData = calculateHeatmapData(sessions, 91);
  const weeklyData = calculateWeeklyFocus(sessions);
  const dailyData = calculateDailyFocus(sessions);
  const periodData = calculatePeriodFocus(sessions, timeframe === "today" ? 1 : timeframe === "7d" ? 7 : timeframe === "30d" ? 30 : 90);

  // Distraction category breakdown
  const categoryCounts: Record<string, number> = {};
  distractions.forEach((d) => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });
  const topDistraction = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  const maxWeeklySec = Math.max(1, ...weeklyData.days.map((d) => d.seconds));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Analytics & Insights</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Understand where your time went and build a sustainable focus habit.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 self-start sm:self-auto">
          {(["today", "7d", "30d", "90d"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                timeframe === tf
                  ? "bg-neutral-800 text-white shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tf === "today" ? "Today" : tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Focus Time */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Focused Time</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {formatDuration(timeframe === "today" ? dailyData.totalSeconds : periodData.totalSeconds)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {timeframe === "today"
              ? `${dailyData.sessionsCount} sessions today`
              : `Avg ${formatDuration(periodData.avgDailySeconds)} / day`}
          </div>
        </div>

        {/* Sessions & Completion */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Sessions</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {timeframe === "today" ? dailyData.sessionsCount : periodData.totalSessions}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <span>
              {timeframe === "today"
                ? `${dailyData.completedCount} completed`
                : `${periodData.completedSessions} completed (${
                    periodData.totalSessions > 0
                      ? Math.round((periodData.completedSessions / periodData.totalSessions) * 100)
                      : 0
                  }%)`}
            </span>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{streak.currentStreak}</span>
            <span className="text-xs font-sans font-normal text-neutral-400">days</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 truncate">
            {streak.currentStreak > 0 ? "Keep the chain going" : "Start your streak today"}
            <span className="text-neutral-500 ml-1">(Best: {streak.bestStreak}d)</span>
          </div>
        </div>

        {/* Focus Score */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/90 relative">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              Focus Score
              <button
                onClick={() => setShowScoreExplainer(true)}
                title="How is this calculated?"
                className="text-neutral-500 hover:text-white"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight flex items-baseline gap-1">
            <span>{focusScore.score}</span>
            <span className="text-xs font-sans font-normal text-neutral-500">/ 100</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Consistency index</span>
            <button
              onClick={() => setShowScoreExplainer(true)}
              className="text-[10px] text-amber-400/80 hover:text-amber-300 underline"
            >
              Formula
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Weekly Bar Chart & Daily Target */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Focus This Week</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Total: <span className="font-mono text-amber-400">{formatDuration(weeklyData.totalSeconds)}</span>
                {weeklyData.bestDay && (
                  <span className="ml-2">
                    • Best day:{" "}
                    <span className="text-white font-medium">
                      {weeklyData.bestDay.dayName} ({formatDuration(weeklyData.bestDay.seconds)})
                    </span>
                  </span>
                )}
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-neutral-500" />
          </div>

          {/* Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1">
            {weeklyData.days.map((day) => {
              const heightPercent = maxWeeklySec > 0 ? Math.max(6, (day.seconds / maxWeeklySec) * 100) : 6;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDuration(day.seconds, true)}
                  </span>
                  <div className="w-full max-w-[40px] bg-neutral-900 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        day.isToday
                          ? "bg-amber-400 group-hover:bg-amber-300"
                          : day.seconds > 0
                          ? "bg-neutral-700 group-hover:bg-amber-500/80"
                          : "bg-neutral-800/40"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-[11px] block ${
                        day.isToday ? "text-amber-400 font-bold" : "text-neutral-400"
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Goal & Summary Card */}
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/90 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Daily Goal
              </span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>

            {settings.dailyGoalHours > 0 ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-bold text-white">
                    {formatDuration(dailyData.totalSeconds)}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    / {settings.dailyGoalHours}h target
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyData.totalSeconds / (settings.dailyGoalHours * 3600)) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="text-[11px] text-neutral-400">
                  {dailyData.totalSeconds >= settings.dailyGoalHours * 3600 ? (
                    <span className="text-emerald-400 font-medium">Daily focus goal achieved today!</span>
                  ) : (
                    <span>
                      {formatDuration(
                        Math.max(0, settings.dailyGoalHours * 3600 - dailyData.totalSeconds)
                      )}{" "}
                      remaining to reach goal
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-500 py-4">
                No daily goal set. You can set a target in settings.
              </div>
            )}
          </div>

          {/* Practical Distraction Suggestions */}
          <div className="pt-4 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Distraction Guidance</span>
            </div>

            {distractions.length > 0 && topDistraction ? (
              <div className="text-xs text-neutral-400 space-y-1">
                <p>
                  <span className="capitalize text-white font-medium">{topDistraction[0]}</span> appeared in{" "}
                  <span className="text-amber-400 font-bold">{topDistraction[1]}</span> logged{" "}
                  {topDistraction[1] === 1 ? "distraction" : "distractions"}.
                </p>
                <div className="text-[11px] text-neutral-400 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 space-y-1">
                  {topDistraction[0] === "phone" && (
                    <>
                      <div>• Keep your phone in another room during sprints</div>
                      <div>• Turn on Do Not Disturb before starting</div>
                    </>
                  )}
                  {topDistraction[0] === "social" && (
                    <>
                      <div>• Close social tabs before clicking Start</div>
                      <div>• Enter Fullscreen mode (F) to prevent habit-clicking</div>
                    </>
                  )}
                  {topDistraction[0] === "browser" && (
                    <>
                      <div>• Use single-window workspace when coding or writing</div>
                      <div>• Jot questions on paper instead of switching tabs</div>
                    </>
                  )}
                  {topDistraction[0] === "person" && (
                    <>
                      <div>• Wear headphones as a visible &ldquo;in focus&rdquo; signal</div>
                      <div>• Schedule a 5-minute buffer break for check-ins</div>
                    </>
                  )}
                  {topDistraction[0] === "other" && (
                    <div>• Write intrusive thoughts onto a physical notepad to revisit later</div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                Log distractions during sessions to discover personalized suggestions.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Focus by Task breakdown */}
      <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/90 space-y-3">
        <h3 className="text-sm font-semibold text-white tracking-tight">Focus Breakdown by Task</h3>
        {dailyData.tasksBreakdown.length > 0 ? (
          <div className="space-y-2.5">
            {dailyData.tasksBreakdown.map((t, idx) => {
              const percent =
                dailyData.totalSeconds > 0 ? Math.round((t.seconds / dailyData.totalSeconds) * 100) : 0;
              return (
                <div key={idx} className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{t.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] text-neutral-400">
                        {t.project}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-neutral-400 text-[11px]">{t.count} sess</span>
                      <span className="text-amber-400 font-bold">{formatDuration(t.seconds)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 py-3">No focus tasks completed today yet.</p>
        )}
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap days={heatmapData} />

      {/* Transparent Focus Score Formula Modal */}
      {showScoreExplainer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="score-explainer-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowScoreExplainer(false)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 id="score-explainer-title" className="text-lg font-bold text-white tracking-tight">
                How Your Focus Score is Calculated
              </h3>
            </div>

            <p className="text-xs text-neutral-300">
              The Focus Score is a personal consistency metric (0–100), not a mysterious AI black-box. It combines 4 transparent components:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">1. Session Completion Rate (30%)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Percentage of started sessions that were completed without early cancel.
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold ml-3">
                  {focusScore.completionRateScore} / 30 pts
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">2. Weekly Consistency (30%)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Active days over the last 7 days ({focusScore.activeDaysLastWeek} of 7 days).
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold ml-3">
                  {focusScore.consistencyScore} / 30 pts
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">3. Interruption Control (20%)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Low ratio of interruptions and logged distractions during focus.
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold ml-3">
                  {focusScore.interruptionScore} / 20 pts
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">4. Daily Target Progress (20%)</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Progress toward your set daily focus target ({focusScore.todayGoalPercent}% achieved).
                  </div>
                </div>
                <span className="font-mono text-amber-400 font-bold ml-3">
                  {focusScore.goalProgressScore} / 20 pts
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span>Total Calculated Score</span>
              <span className="font-mono font-bold text-sm text-white">
                {focusScore.score} / 100
              </span>
            </div>

            <button
              onClick={() => setShowScoreExplainer(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
