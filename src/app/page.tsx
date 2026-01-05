"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { TaskBrowser } from "@/components/TaskBrowser";
import { WorkTimeInput } from "@/components/WorkTimeInput";
import { TaskList } from "@/components/TaskList";
import { MessagePreview } from "@/components/MessagePreview";
import { TaskItem, GitHubRepo, SavedSettings, FilterPreset } from "@/types";
import { getRepos } from "@/lib/github";
import {
  loadSettings,
  addFilterPreset,
  updateFilterPreset,
  deleteFilterPreset,
  setActivePreset,
  setTimeInputMode,
} from "@/lib/storage";

type TabType = "start" | "end";

export default function Home() {
  const { data: session } = useSession();
  const accessToken =
    (session as { accessToken?: string } | null)?.accessToken ?? null;

  const [activeTab, setActiveTab] = useState<TabType>("start");
  const [settings, setSettings] = useState<SavedSettings | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [endTime, setEndTime] = useState("18:00");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [doneTasks, setDoneTasks] = useState<TaskItem[]>([]);
  const [nextTasks, setNextTasks] = useState<TaskItem[]>([]);
  const [addTarget, setAddTarget] = useState<"tasks" | "doneTasks" | "nextTasks">("tasks");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    getRepos(accessToken).then(setRepos).catch(console.error);
  }, [accessToken]);

  const handleSelectPreset = (id: string | null) => {
    setSettings(setActivePreset(id));
  };

  const handleSavePreset = (preset: FilterPreset) => {
    const existing = settings?.filterPresets.find((p) => p.id === preset.id);
    if (existing) {
      setSettings(updateFilterPreset(preset));
    } else {
      const newSettings = addFilterPreset(preset);
      setSettings(setActivePreset(preset.id));
      setSettings(newSettings);
    }
  };

  const handleDeletePreset = (id: string) => {
    setSettings(deleteFilterPreset(id));
  };

  const handleTimeInputModeChange = (mode: "endTime" | "duration") => {
    setSettings(setTimeInputMode(mode));
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
  };

  const handleAddTask = (task: TaskItem, target: "tasks" | "doneTasks" | "nextTasks") => {
    if (target === "tasks") {
      setTasks((prev) => [...prev, task]);
    } else if (target === "doneTasks") {
      setDoneTasks((prev) => [...prev, task]);
    } else if (target === "nextTasks") {
      setNextTasks((prev) => [...prev, task]);
    }
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveDoneTask = (id: string) => {
    setDoneTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveNextTask = (id: string) => {
    setNextTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveTaskByTarget = (id: string, target: "tasks" | "doneTasks" | "nextTasks") => {
    if (target === "tasks") {
      handleRemoveTask(id);
    } else if (target === "doneTasks") {
      handleRemoveDoneTask(id);
    } else if (target === "nextTasks") {
      handleRemoveNextTask(id);
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] noise">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 relative z-10">
        <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up">
          <TaskBrowser
            repos={repos}
            presets={settings.filterPresets}
            activePresetId={settings.activePresetId}
            onSelectPreset={handleSelectPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            accessToken={accessToken}
            onAddTask={handleAddTask}
            onRemoveTask={handleRemoveTaskByTarget}
            existingTasks={tasks}
            existingDoneTasks={doneTasks}
            existingNextTasks={nextTasks}
            addTarget={addTarget}
            onAddTargetChange={setAddTarget}
          />
        </section>

        <div className="relative bg-[var(--surface)] rounded-2xl p-1.5 border border-[var(--border)] animate-fade-in-up stagger-1">
          <div className="flex">
            <button
              onClick={() => setActiveTab("start")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                activeTab === "start"
                  ? "bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white shadow-lg shadow-orange-500/25"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-lg">🌅</span>
              業務開始
            </button>
            <button
              onClick={() => setActiveTab("end")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                activeTab === "end"
                  ? "bg-gradient-to-r from-[var(--accent)] to-orange-600 text-white shadow-lg shadow-orange-500/25"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-lg">🌙</span>
              業務終了
            </button>
          </div>
        </div>

        {activeTab === "start" ? (
          <div className="space-y-5">
            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[var(--accent)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="font-serif text-lg">稼働時間</h2>
              </div>
              <WorkTimeInput
                mode={settings.timeInputMode}
                onModeChange={handleTimeInputModeChange}
                onEndTimeChange={handleEndTimeChange}
              />
            </section>

            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-3">
              <TaskList
                title="やること"
                tasks={tasks}
                onRemove={handleRemoveTask}
              />
            </section>

            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-4">
              <MessagePreview type="start" endTime={endTime} tasks={tasks} />
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-2">
              <TaskList
                title="やったこと"
                tasks={doneTasks}
                onRemove={handleRemoveDoneTask}
              />
            </section>

            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-3">
              <TaskList
                title="次の自分へ"
                tasks={nextTasks}
                onRemove={handleRemoveNextTask}
              />
            </section>

            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-4">
              <MessagePreview
                type="end"
                doneTasks={doneTasks}
                nextTasks={nextTasks}
                tasks={[]}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
