import type {
  FocusSession,
  Distraction,
  HeatmapDayData,
  FocusScoreBreakdown,
  StreakInfo,
} from "../types/focus";

/**
 * Returns local date string in YYYY-MM-DD format (avoids UTC offset shifts)
 */
export function getLocalDayString(dateInput: Date | string | number = new Date()): string {
  const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format seconds into mm:ss or hh:mm:ss for timer display
 */
export function formatTimeRemaining(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

/**
 * Format duration for human-readable summaries: "2h 18m", "45m", "< 1m"
 */
export function formatDuration(totalSeconds: number, compact = false): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    if (sec > 0 && !compact) return `${sec}s`;
    return "0m";
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Filter sessions that were focus sessions (exclude breaks from focus time accounting)
 */
export function getFocusSessionsOnly(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((s) => s.sessionType === "focus");
}

/**
 * Calculate stats for a specific day
 */
export function calculateDailyFocus(sessions: FocusSession[], dayString = getLocalDayString()) {
  const focusOnly = getFocusSessionsOnly(sessions);
  const daysSessions = focusOnly.filter((s) => getLocalDayString(s.startedAt) === dayString);

  let totalSeconds = 0;
  let completedCount = 0;
  let interruptedCount = 0;
  const taskMap = new Map<string, { title: string; project: string; seconds: number; count: number }>();

  for (const s of daysSessions) {
    totalSeconds += s.durationSeconds;
    if (s.completed) completedCount++;
    if (s.interrupted) interruptedCount++;

    const key = s.taskTitle || "Focus Session";
    const existing = taskMap.get(key) || {
      title: key,
      project: s.project || "General",
      seconds: 0,
      count: 0,
    };
    existing.seconds += s.durationSeconds;
    existing.count += 1;
    taskMap.set(key, existing);
  }

  const tasksBreakdown = Array.from(taskMap.values()).sort((a, b) => b.seconds - a.seconds);

  return {
    date: dayString,
    totalSeconds,
    sessionsCount: daysSessions.length,
    completedCount,
    interruptedCount,
    tasksBreakdown,
  };
}

/**
 * Calculate weekly focus stats (last 7 days ending today)
 */
export function calculateWeeklyFocus(sessions: FocusSession[], today = new Date()) {
  const focusOnly = getFocusSessionsOnly(sessions);
  const days: { dayName: string; date: string; seconds: number; isToday: boolean }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let totalSeconds = 0;
  let bestDay: { dayName: string; seconds: number; date: string } | null = null;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDayString(d);
    const dayName = dayNames[d.getDay()];
    const isToday = i === 0;

    const daySessions = focusOnly.filter((s) => getLocalDayString(s.startedAt) === dateStr);
    const daySec = daySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);

    totalSeconds += daySec;
    days.push({
      dayName,
      date: dateStr,
      seconds: daySec,
      isToday,
    });

    if (!bestDay || daySec > bestDay.seconds) {
      if (daySec > 0) {
        bestDay = { dayName, seconds: daySec, date: dateStr };
      }
    }
  }

  return {
    days,
    totalSeconds,
    bestDay,
  };
}

/**
 * Calculate monthly / multi-day overview stats
 */
export function calculatePeriodFocus(sessions: FocusSession[], daysRange = 30) {
  const focusOnly = getFocusSessionsOnly(sessions);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - daysRange);
  const cutoffStr = getLocalDayString(cutoff);

  const periodSessions = focusOnly.filter((s) => getLocalDayString(s.startedAt) >= cutoffStr);

  let totalSeconds = 0;
  let completedSessions = 0;
  let interruptedSessions = 0;
  const dayTotals: Record<string, number> = {};

  for (const s of periodSessions) {
    totalSeconds += s.durationSeconds;
    if (s.completed) completedSessions++;
    if (s.interrupted) interruptedSessions++;

    const day = getLocalDayString(s.startedAt);
    dayTotals[day] = (dayTotals[day] || 0) + s.durationSeconds;
  }

  let bestDay: { date: string; seconds: number } | null = null;
  for (const [date, sec] of Object.entries(dayTotals)) {
    if (!bestDay || sec > bestDay.seconds) {
      bestDay = { date, seconds: sec };
    }
  }

  const activeDaysCount = Object.keys(dayTotals).length;
  const avgDailySeconds = activeDaysCount > 0 ? Math.round(totalSeconds / daysRange) : 0;
  const interruptionRate =
    periodSessions.length > 0 ? Math.round((interruptedSessions / periodSessions.length) * 100) : 0;

  return {
    totalSeconds,
    totalSessions: periodSessions.length,
    completedSessions,
    interruptedSessions,
    interruptionRate,
    avgDailySeconds,
    bestDay,
    activeDaysCount,
  };
}

/**
 * Consecutive days calculation with at least 1 focus session
 */
export function calculateStreak(sessions: FocusSession[]): StreakInfo {
  const focusOnly = getFocusSessionsOnly(sessions);
  if (focusOnly.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      isActiveToday: false,
    };
  }

  // Get set of unique active dates
  const activeDatesSet = new Set<string>();
  for (const s of focusOnly) {
    if (s.durationSeconds >= 60) {
      activeDatesSet.add(getLocalDayString(s.startedAt));
    }
  }

  const todayStr = getLocalDayString(new Date());
  const isActiveToday = activeDatesSet.has(todayStr);

  // Sort dates ascending
  const sortedDates = Array.from(activeDatesSet).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, lastActiveDate: null, isActiveToday: false };
  }

  const lastActiveDate = sortedDates[sortedDates.length - 1];

  // Calculate best streak historically
  let bestStreak = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const parts = dateStr.split("-").map(Number);
    const currentDate = new Date(parts[0], parts[1] - 1, parts[2]);

    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > bestStreak) {
      bestStreak = currentRun;
    }
    prevDate = currentDate;
  }

  // Calculate current streak: walk backwards from today or yesterday
  let currentStreak = 0;
  const walkDate = new Date();
  let walkStr = getLocalDayString(walkDate);

  // If today is not active yet, see if yesterday was active
  if (!activeDatesSet.has(walkStr)) {
    walkDate.setDate(walkDate.getDate() - 1);
    walkStr = getLocalDayString(walkDate);
  }

  while (activeDatesSet.has(walkStr)) {
    currentStreak += 1;
    walkDate.setDate(walkDate.getDate() - 1);
    walkStr = getLocalDayString(walkDate);
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    lastActiveDate,
    isActiveToday,
  };
}

/**
 * Deterministic Focus Score (0 - 100):
 * - 30% Session completion rate
 * - 30% Consistency (active days out of last 7)
 * - 20% Interruption control (few distractions / interruptions)
 * - 20% Daily goal progress
 */
export function calculateFocusScore(
  sessions: FocusSession[],
  distractions: Distraction[],
  dailyGoalHours = 3
): FocusScoreBreakdown {
  const focusOnly = getFocusSessionsOnly(sessions);
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const cutoffStr = getLocalDayString(sevenDaysAgo);

  const recentSessions = focusOnly.filter((s) => getLocalDayString(s.startedAt) >= cutoffStr);
  const recentDistractions = distractions.filter((d) => getLocalDayString(d.timestamp) >= cutoffStr);

  // 1. Completion Rate Score (max 30 pts)
  let actualCompletionRate = 100;
  let completionRateScore = 30;
  if (recentSessions.length > 0) {
    const completed = recentSessions.filter((s) => s.completed).length;
    actualCompletionRate = Math.round((completed / recentSessions.length) * 100);
    completionRateScore = Math.round((actualCompletionRate / 100) * 30);
  } else {
    completionRateScore = 20; // baseline for new user
  }

  // 2. Consistency Score (max 30 pts)
  const activeDays = new Set<string>();
  for (const s of recentSessions) {
    activeDays.add(getLocalDayString(s.startedAt));
  }
  const activeDaysLastWeek = activeDays.size;
  // 5+ days active = 30 pts; proportional below
  const consistencyScore = Math.min(30, Math.round((activeDaysLastWeek / 5) * 30));

  // 3. Interruption Control (max 20 pts)
  const interruptionCount = recentSessions.filter((s) => s.interrupted).length + recentDistractions.length;
  // Fewer interruptions relative to sessions
  let interruptionScore = 20;
  if (recentSessions.length > 0) {
    const ratio = interruptionCount / recentSessions.length;
    // ratio 0 -> 20pts; ratio 0.5 -> 14pts; ratio >= 1 -> 5pts
    interruptionScore = Math.max(5, Math.min(20, Math.round(20 - ratio * 15)));
  }

  // 4. Daily Goal Progress (max 20 pts)
  let todayGoalPercent = 0;
  let goalProgressScore = 15;
  if (dailyGoalHours > 0) {
    const todayStr = getLocalDayString(now);
    const todaySessions = focusOnly.filter((s) => getLocalDayString(s.startedAt) === todayStr);
    const todaySec = todaySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const targetSec = dailyGoalHours * 3600;
    todayGoalPercent = Math.min(150, Math.round((todaySec / targetSec) * 100));
    goalProgressScore = Math.min(20, Math.round((todayGoalPercent / 100) * 20));
  }

  const score = Math.min(100, Math.max(10, completionRateScore + consistencyScore + interruptionScore + goalProgressScore));

  return {
    score,
    completionRateScore,
    consistencyScore,
    interruptionScore,
    goalProgressScore,
    actualCompletionRate,
    activeDaysLastWeek,
    interruptionCountLastWeek: interruptionCount,
    todayGoalPercent,
  };
}

/**
 * Calendar Heatmap Data (defaults to last 84 days = 12 full weeks)
 */
export function calculateHeatmapData(sessions: FocusSession[], totalDays = 91): HeatmapDayData[] {
  const focusOnly = getFocusSessionsOnly(sessions);
  const result: HeatmapDayData[] = [];
  const today = new Date();

  // Aggregate sessions by date
  const dateMap = new Map<string, { totalSeconds: number; sessionCount: number; tasks: Map<string, number> }>();
  for (const s of focusOnly) {
    const dStr = getLocalDayString(s.startedAt);
    const entry = dateMap.get(dStr) || { totalSeconds: 0, sessionCount: 0, tasks: new Map<string, number>() };
    entry.totalSeconds += s.durationSeconds;
    entry.sessionCount += 1;
    const taskTitle = s.taskTitle || "Focus Session";
    entry.tasks.set(taskTitle, (entry.tasks.get(taskTitle) || 0) + s.durationSeconds);
    dateMap.set(dStr, entry);
  }

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDayString(d);
    const existing = dateMap.get(dateStr);

    const totalSeconds = existing ? existing.totalSeconds : 0;
    const sessionCount = existing ? existing.sessionCount : 0;
    const tasks = existing
      ? Array.from(existing.tasks.entries()).map(([title, seconds]) => ({ title, seconds }))
      : [];

    // Intensity levels (0 to 4)
    // 0: 0m
    // 1: < 45m (1-2 sessions)
    // 2: 45m - 1.5h
    // 3: 1.5h - 3h
    // 4: > 3h
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (totalSeconds > 0) {
      if (totalSeconds < 2700) intensity = 1;
      else if (totalSeconds < 5400) intensity = 2;
      else if (totalSeconds < 10800) intensity = 3;
      else intensity = 4;
    }

    result.push({
      date: dateStr,
      totalSeconds,
      sessionCount,
      tasks,
      intensity,
    });
  }

  return result;
}

/**
 * Task aggregate analytics
 */
export function calculateTaskStats(taskId: string, sessions: FocusSession[]) {
  const taskSessions = getFocusSessionsOnly(sessions).filter((s) => s.taskId === taskId);
  const totalSeconds = taskSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const sessionCount = taskSessions.length;
  const avgSeconds = sessionCount > 0 ? Math.round(totalSeconds / sessionCount) : 0;

  let lastFocused: string | null = null;
  if (sessionCount > 0) {
    const sorted = [...taskSessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    lastFocused = sorted[0].startedAt;
  }

  return {
    totalSeconds,
    sessionCount,
    avgSeconds,
    lastFocused,
  };
}

/**
 * Group sessions by local day string
 */
export function groupSessionsByDay(sessions: FocusSession[]): Record<string, FocusSession[]> {
  const groups: Record<string, FocusSession[]> = {};
  for (const s of sessions) {
    const d = getLocalDayString(s.startedAt);
    if (!groups[d]) groups[d] = [];
    groups[d].push(s);
  }
  return groups;
}
