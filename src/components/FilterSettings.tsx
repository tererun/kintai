"use client";

import { useState, useEffect } from "react";
import { FilterPreset, GitHubRepo } from "@/types";
import { generateId } from "@/lib/storage";

interface FilterSettingsProps {
  repos: GitHubRepo[];
  presets: FilterPreset[];
  activePresetId: string | null;
  onSelectPreset: (id: string | null) => void;
  onSavePreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
  onFilterChange: (filter: Omit<FilterPreset, "id" | "name">) => void;
}

export function FilterSettings({
  repos,
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onFilterChange,
}: FilterSettingsProps) {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [assignee, setAssignee] = useState("");
  const [labels, setLabels] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const activePreset = presets.find((p) => p.id === activePresetId);

  useEffect(() => {
    if (activePreset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRepos(activePreset.repos);
      setState(activePreset.state);
      setAssignee(activePreset.assignee ?? "");
      setLabels(activePreset.labels.join(", "));
    }
  }, [activePreset]);

  useEffect(() => {
    onFilterChange({
      repos: selectedRepos,
      state,
      assignee: assignee.trim() || null,
      labels: labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  }, [selectedRepos, state, assignee, labels, onFilterChange]);

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const handleToggleRepo = (repoFullName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoFullName)
        ? prev.filter((r) => r !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  const handleSaveAsPreset = () => {
    if (!presetName.trim()) return;
    const newPreset: FilterPreset = {
      id: generateId(),
      name: presetName.trim(),
      repos: selectedRepos,
      state,
      assignee: assignee.trim() || null,
      labels: labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    onSavePreset(newPreset);
    setShowSaveDialog(false);
    setPresetName("");
  };

  const handleUpdatePreset = () => {
    if (!activePreset) return;
    const updatedPreset: FilterPreset = {
      ...activePreset,
      repos: selectedRepos,
      state,
      assignee: assignee.trim() || null,
      labels: labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    onSavePreset(updatedPreset);
  };

  const handleDeletePreset = () => {
    if (activePresetId && confirm("このプリセットを削除しますか？")) {
      onDeletePreset(activePresetId);
    }
  };

  const hasChanges =
    activePreset &&
    (JSON.stringify(selectedRepos) !== JSON.stringify(activePreset.repos) ||
      state !== activePreset.state ||
      (assignee.trim() || null) !== activePreset.assignee ||
      JSON.stringify(
        labels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean)
      ) !== JSON.stringify(activePreset.labels));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          フィルター設定
        </button>
        <div className="flex items-center gap-2">
          {selectedRepos.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              {selectedRepos.length} リポジトリ
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 p-5 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <select
                value={activePresetId ?? ""}
                onChange={(e) => onSelectPreset(e.target.value || null)}
                className="w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200 appearance-none cursor-pointer"
              >
                <option value="">プリセットから読み込み</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {activePreset && (
              <button
                onClick={handleDeletePreset}
                className="p-2.5 rounded-xl border-2 border-[var(--border)] text-[var(--muted)] hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="プリセットを削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">リポジトリ</label>
            <div className="relative mb-2">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="リポジトリを検索..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border-2 border-[var(--border)] rounded-xl bg-[var(--surface)]">
              {repos.length === 0 ? (
                <p className="text-sm text-[var(--muted)] p-4 text-center">
                  ログインしてリポジトリを読み込み
                </p>
              ) : filteredRepos.length === 0 ? (
                <p className="text-sm text-[var(--muted)] p-4 text-center">
                  該当するリポジトリがありません
                </p>
              ) : (
                filteredRepos.map((repo) => (
                  <label
                    key={repo.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent-soft)] cursor-pointer transition-colors duration-200 border-b border-[var(--border)] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(repo.full_name)}
                      onChange={() => handleToggleRepo(repo.full_name)}
                      className="w-4 h-4 rounded border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                    />
                    <span className="text-sm">{repo.full_name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Issue/PRの状態
              </label>
              <div className="inline-flex p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                {(["open", "closed", "all"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setState(s)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      state === s
                        ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {s === "open"
                      ? "オープン"
                      : s === "closed"
                        ? "クローズ"
                        : "すべて"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                アサイニー
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="GitHubユーザー名"
                className="w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ラベル{" "}
              <span className="text-[var(--muted)] font-normal">
                (カンマ区切り)
              </span>
            </label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="bug, enhancement"
              className="w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
            {activePreset && hasChanges && (
              <button
                onClick={handleUpdatePreset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                プリセットを更新
              </button>
            )}

            {showSaveDialog ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="プリセット名"
                  className="flex-1 px-4 py-2 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveAsPreset()}
                />
                <button
                  onClick={handleSaveAsPreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--accent)] to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPresetName("");
                  }}
                  className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={selectedRepos.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                新規プリセットとして保存
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
