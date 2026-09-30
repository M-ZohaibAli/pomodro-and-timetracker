"use client";

import React, { useState } from "react";
import { Task, FocusSession } from "@/types/focus";
import { formatDuration, calculateTaskStats } from "@/lib/calculations";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Play,
  Trash2,
  Folder,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  sessions: FocusSession[];
  activeTaskId: string | null;
  onSelectTask: (task: Task) => void;
  onStartWithTask: (task: Task) => void;
  onAddTask: (title: string, project: string, estimatedPomodoros: number) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  sessions,
  activeTaskId,
  onSelectTask,
  onStartWithTask,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("active");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "time" | "title">("recent");

  // New task form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("General");
  const [newEstimated, setNewEstimated] = useState(3);

  // Expanded task ID for viewing task analytics
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Extract unique projects
  const projects = Array.from(new Set(tasks.map((t) => t.project || "General")));

  // Filter & sort
  const filteredTasks = tasks
    .filter((t) => {
      if (statusFilter === "active" && t.status === "completed") return false;
      if (statusFilter === "completed" && t.status !== "completed") return false;
      if (selectedProject !== "all" && (t.project || "General") !== selectedProject) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(query) ||
          (t.project && t.project.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        return (b.totalFocusSeconds || 0) - (a.totalFocusSeconds || 0);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      // "recent"
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newProject.trim() || "General", Number(newEstimated) || 1);
    setNewTitle("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12 animate-in fade-in">
      {/* Header and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Tasks & Focus Targets</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Attach focus time to lightweight tasks to measure your real output.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add task</span>
          </button>
        )}
      </div>

      {/* New Task Inline Creation Panel */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/50 space-y-3 animate-in fade-in"
        >
          <div className="text-xs font-semibold text-white">What are you working on?</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Build landing page hero section..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Project (optional)"
                className="w-1/2 px-3 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <div className="w-1/2 flex items-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                <span className="text-[10px] text-neutral-500">Est:</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newEstimated}
                  onChange={(e) => setNewEstimated(Number(e.target.value))}
                  className="w-full bg-transparent font-mono text-white focus:outline-none"
                  title="Estimated Pomodoros"
                />
                <span className="text-[10px] text-neutral-500">pomo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTitle("");
              }}
              className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors"
            >
              Save task
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters Bar */}
      <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by name or project..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-0.5">
            {(["active", "completed", "all"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === st
                    ? "bg-neutral-800 text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Project Dropdown */}
          {projects.length > 0 && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "time" | "title")}
            className="px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="recent">Recently Added</option>
            <option value="time">Most Time Focused</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-neutral-950 border border-neutral-800/80 p-8 space-y-3">
            <Folder className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-semibold text-white">No tasks found</div>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              What are you working on? Create your first task to attach focused sessions directly to it.
            </p>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-semibold text-xs hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create task
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelectedForTimer = activeTaskId === task.id;
            const isCompleted = task.status === "completed";
            const isExpanded = expandedTaskId === task.id;
            const stats = calculateTaskStats(task.id, sessions);

            return (
              <div
                key={task.id}
                className={`rounded-2xl transition-all border ${
                  isSelectedForTimer
                    ? "bg-neutral-900/90 border-amber-500/80 shadow-md shadow-amber-950/20"
                    : "bg-neutral-950 border-neutral-800/80 hover:border-neutral-700"
                }`}
              >
                {/* Main Task Item Row */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  {/* Left: Complete toggle & title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTaskComplete(task.id)}
                      className="text-neutral-500 hover:text-emerald-400 transition-colors shrink-0"
                      title={isCompleted ? "Mark active" : "Mark completed"}
                      aria-label={isCompleted ? "Mark active" : "Mark completed"}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => onSelectTask(task)}
                          className={`text-sm font-medium cursor-pointer hover:text-amber-300 transition-colors truncate ${
                            isCompleted ? "line-through text-neutral-500" : "text-white"
                          }`}
                        >
                          {task.title}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                          {task.project || "General"}
                        </span>

                        {isSelectedForTimer && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-semibold">
                            Current Timer Task
                          </span>
                        )}
                      </div>

                      {/* Sub-meta: Pomodoros and total time */}
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-mono">
                        <span>
                          {task.completedPomodoros} / {task.estimatedPomodoros} Pomodoros
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">
                          {formatDuration(task.totalFocusSeconds || stats.totalSeconds)} focused
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onStartWithTask(task)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-amber-400 hover:text-neutral-950 border border-neutral-800 text-amber-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                      title="Focus on this task now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Focus</span>
                    </button>

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="View task statistics"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Task Analytics (Section 32) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-neutral-850 text-xs bg-neutral-950/60 rounded-b-2xl space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 block font-sans">Total Time</span>
                        <span className="text-white font-bold text-sm">
                          {formatDuration(stats.totalSeconds || task.totalFocusSeconds)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 block font-sans">Sessions</span>
                        <span className="text-white font-bold text-sm">{stats.sessionCount}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 block font-sans">Avg Session</span>
                        <span className="text-white font-bold text-sm">
                          {stats.avgSeconds > 0 ? formatDuration(stats.avgSeconds) : "—"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <span className="text-[10px] text-neutral-500 block font-sans">Last Focused</span>
                        <span className="text-neutral-300 text-xs font-sans">
                          {stats.lastFocused
                            ? new Date(stats.lastFocused).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : "Not yet"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
