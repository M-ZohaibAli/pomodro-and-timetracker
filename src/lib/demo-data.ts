import {
  Task,
  FocusSession,
  Distraction,
  UserSettings,
} from "@/types/focus";
import { getLocalDayString } from "@/lib/calculations";

export function generateDemoData(): {
  tasks: Task[];
  sessions: FocusSession[];
  distractions: Distraction[];
  settings: UserSettings;
} {
  const now = new Date();

  const tasks: Task[] = [
    {
      id: "demo-task-1",
      title: "Build portfolio website",
      project: "Coding",
      estimatedPomodoros: 6,
      completedPomodoros: 4,
      totalFocusSeconds: 6120, // ~1h 42m
      status: "active",
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      id: "demo-task-2",
      title: "Design design-system tokens",
      project: "Design",
      estimatedPomodoros: 4,
      completedPomodoros: 3,
      totalFocusSeconds: 4500, // 1h 15m
      status: "active",
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
    {
      id: "demo-task-3",
      title: "Study Linear Algebra & Matrices",
      project: "Study",
      estimatedPomodoros: 8,
      completedPomodoros: 6,
      totalFocusSeconds: 9000, // 2.5h
      status: "active",
      createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
    },
    {
      id: "demo-task-4",
      title: "Customer feedback review & bug triaging",
      project: "Product",
      estimatedPomodoros: 3,
      completedPomodoros: 3,
      totalFocusSeconds: 4500,
      status: "completed",
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      completedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "demo-task-5",
      title: "Draft blog post on time management",
      project: "Writing",
      estimatedPomodoros: 4,
      completedPomodoros: 2,
      totalFocusSeconds: 3000,
      status: "active",
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: "demo-task-6",
      title: "Read Clean Architecture ch. 6-7",
      project: "Learning",
      estimatedPomodoros: 2,
      completedPomodoros: 2,
      totalFocusSeconds: 3000,
      status: "completed",
      createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
      completedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  const sessions: FocusSession[] = [];
  const distractions: Distraction[] = [];

  // Generate sessions across last 35 days to build a solid 14-day streak and heat map
  let sessionCounter = 1;

  for (let daysAgo = 35; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(now);
    dayDate.setDate(now.getDate() - daysAgo);

    // Give high activity in last 14 days for streak
    // Skip occasional weekend days before day 14
    if (daysAgo > 14 && (dayDate.getDay() === 0 || dayDate.getDay() === 6) && Math.random() < 0.6) {
      continue;
    }

    // Number of sessions today
    let sessionCount = 0;
    if (daysAgo === 0) {
      // Today: 3 completed sessions
      sessionCount = 3;
    } else if (daysAgo <= 14) {
      // Last 14 days: 2 to 5 sessions per day
      sessionCount = 2 + (daysAgo % 4);
    } else {
      sessionCount = 1 + (daysAgo % 3);
    }

    const startHours = [9, 10, 11, 14, 15, 16];

    for (let sIdx = 0; sIdx < sessionCount; sIdx++) {
      const assignedTask = tasks[sIdx % tasks.length];
      const hour = startHours[sIdx % startHours.length] || 10;
      const start = new Date(dayDate);
      start.setHours(hour, (sIdx * 12) % 60, 0, 0);

      // Duration: 25 minutes standard, occasional 50 min
      const durationSec = sIdx === 1 && daysAgo % 3 === 0 ? 3000 : 1500;
      const end = new Date(start.getTime() + durationSec * 1000);

      const isInterrupted = daysAgo % 7 === 1 && sIdx === 0;

      sessions.push({
        id: `demo-sess-${sessionCounter++}`,
        taskId: assignedTask.id,
        taskTitle: assignedTask.title,
        project: assignedTask.project,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        durationSeconds: durationSec,
        sessionType: "focus",
        completed: !isInterrupted,
        interrupted: isInterrupted,
        pauseDurationSeconds: isInterrupted ? 120 : 0,
        isManual: false,
      });

      // Distraction log occasionally
      if (isInterrupted || (daysAgo <= 7 && sIdx === 1 && Math.random() < 0.5)) {
        const categories: ("phone" | "social" | "browser" | "person")[] = [
          "social",
          "phone",
          "browser",
          "person",
        ];
        distractions.push({
          id: `demo-dist-${distractions.length + 1}`,
          sessionId: `demo-sess-${sessionCounter - 1}`,
          category: categories[distractions.length % categories.length],
          note:
            distractions.length % 2 === 0
              ? "Checked notification banner"
              : "Opened social feed automatically",
          timestamp: new Date(start.getTime() + 600000).toISOString(),
        });
      }
    }
  }

  const settings: UserSettings = {
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
    hasCompletedTutorial: true,
    isDemoMode: true,
  };

  return { tasks, sessions, distractions, settings };
}
