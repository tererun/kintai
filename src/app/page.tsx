"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { FilterSettings } from "@/components/FilterSettings";
import { WorkTimeInput } from "@/components/WorkTimeInput";
import { TaskList } from "@/components/TaskList";
import { AddTaskModal } from "@/components/AddTaskModal";
import { MessagePreview } from "@/components/MessagePreview";
import { TaskItem, FilterPreset, GitHubRepo, SavedSettings } from "@/types";
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
type ModalTarget = "tasks" | "doneTasks" | "nextTasks" | null;

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
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
  const [currentFilter, setCurrentFilter] = useState<Omit<FilterPreset, "id" | "name">>({
    repos: [],
    state: "open",
    assignee: null,
    reviewer: null,
    labels: [],
  });

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

  const handleFilterChange = useCallback((filter: Omit<FilterPreset, "id" | "name">) => {
    setCurrentFilter(filter);
  }, []);

  const handleTimeInputModeChange = (mode: "endTime" | "duration") => {
    setSettings(setTimeInputMode(mode));
  };

  const handleEndTimeChange = useCallback((time: string) => {
    setEndTime(time);
  }, []);

  const handleAddTask = (task: TaskItem) => {
    if (modalTarget === "tasks") {
      setTasks((prev) => [...prev, task]);
    } else if (modalTarget === "doneTasks") {
      setDoneTasks((prev) => [...prev, task]);
    } else if (modalTarget === "nextTasks") {
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

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] noise">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 relative z-10">
        <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up">
          <FilterSettings
            repos={repos}
            presets={settings.filterPresets}
            activePresetId={settings.activePresetId}
            onSelectPreset={handleSelectPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onFilterChange={handleFilterChange}
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
                onAdd={() => setModalTarget("tasks")}
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
                onAdd={() => setModalTarget("doneTasks")}
              />
            </section>

            <section className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] animate-fade-in-up stagger-3">
              <TaskList
                title="次の自分へ"
                tasks={nextTasks}
                onRemove={handleRemoveNextTask}
                onAdd={() => setModalTarget("nextTasks")}
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

      <AddTaskModal
        isOpen={modalTarget !== null}
        onClose={() => setModalTarget(null)}
        onAdd={handleAddTask}
        accessToken={accessToken}
        activePreset={{
          id: "current",
          name: "Current",
          ...currentFilter,
        }}
        existingTasks={
          modalTarget === 'tasks' ? tasks :
          modalTarget === 'doneTasks' ? doneTasks :
          modalTarget === 'nextTasks' ? nextTasks : []
        }
      />
    </div>
  );
}
