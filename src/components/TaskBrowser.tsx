"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskItem, GitHubIssue, GitHubPullRequest, FilterPreset, GitHubRepo } from "@/types";
import { getIssues, getPullRequests } from "@/lib/github";
import { generateId } from "@/lib/storage";

type AddTarget = "tasks" | "doneTasks" | "nextTasks";

interface TaskBrowserProps {
  repos: GitHubRepo[];
  presets: FilterPreset[];
  activePresetId: string | null;
  onSelectPreset: (id: string | null) => void;
  onSavePreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
  accessToken: string | null;
  onAddTask: (task: TaskItem, target: AddTarget) => void;
  onRemoveTask: (id: string, target: AddTarget) => void;
  existingTasks: TaskItem[];
  existingDoneTasks: TaskItem[];
  existingNextTasks: TaskItem[];
  addTarget: AddTarget;
  onAddTargetChange: (target: AddTarget) => void;
}

type ResultTabType = "issue" | "pr";

const TARGET_LABELS: Record<AddTarget, string> = {
  tasks: "やること",
  doneTasks: "やったこと",
  nextTasks: "次の自分へ",
};

export function TaskBrowser({
  repos,
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  accessToken,
  onAddTask,
  onRemoveTask,
  existingTasks,
  existingDoneTasks,
  existingNextTasks,
  addTarget,
  onAddTargetChange,
}: TaskBrowserProps) {
  // Filter settings state
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const [assignee, setAssignee] = useState("");
  const [assigneeEnabled, setAssigneeEnabled] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [reviewerEnabled, setReviewerEnabled] = useState(false);
  const [labels, setLabels] = useState("");
  const [labelsEnabled, setLabelsEnabled] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Results state
  const [resultTab, setResultTab] = useState<ResultTabType>("issue");
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customText, setCustomText] = useState("");

  const activePreset = presets.find((p) => p.id === activePresetId);

  useEffect(() => {
    if (activePreset) {
      setSelectedRepos(activePreset.repos);
      setState(activePreset.state);
      setAssignee(activePreset.assignee ?? "");
      setAssigneeEnabled(!!activePreset.assignee);
      setReviewer(activePreset.reviewer ?? "");
      setReviewerEnabled(!!activePreset.reviewer);
      setLabels(activePreset.labels.join(", "));
      setLabelsEnabled(activePreset.labels.length > 0);
    }
  }, [activePreset]);

  const currentAssignee = assigneeEnabled && assignee.trim() ? assignee.trim() : null;
  const currentReviewer = reviewerEnabled && reviewer.trim() ? reviewer.trim() : null;

  // Fetch data when filter changes
  const fetchData = useCallback(async () => {
    if (!accessToken || selectedRepos.length === 0) {
      setIssues([]);
      setPullRequests([]);
      return;
    }

    setLoading(true);
    try {
      const allIssues: GitHubIssue[] = [];
      const allPRs: GitHubPullRequest[] = [];

      for (const repo of selectedRepos) {
        try {
          const repoIssues = await getIssues(accessToken, repo, state, currentAssignee);
          allIssues.push(...repoIssues.map(issue => ({ ...issue, _repo: repo } as GitHubIssue & { _repo: string })));
          
          const repoPRs = await getPullRequests(accessToken, repo, state, currentAssignee, currentReviewer);
          allPRs.push(...repoPRs.map(pr => ({ ...pr, _repo: repo } as GitHubPullRequest & { _repo: string })));
        } catch (error) {
          console.error(`Failed to fetch from ${repo}:`, error);
        }
      }

      setIssues(allIssues);
      setPullRequests(allPRs);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedRepos, state, currentAssignee, currentReviewer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.number.toString().includes(searchQuery)
  );

  const filteredPRs = pullRequests.filter(
    (pr) =>
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery)
  );

  const allExistingTasks = [...existingTasks, ...existingDoneTasks, ...existingNextTasks];

  const isIssueAdded = (issue: GitHubIssue) => {
    const repo = (issue as GitHubIssue & { _repo?: string })._repo;
    return allExistingTasks.some(
      (task) => task.url === issue.html_url || 
        (task.type === "issue" && task.repoFullName === repo && task.number === issue.number)
    );
  };

  const isPRAdded = (pr: GitHubPullRequest) => {
    const repo = (pr as GitHubPullRequest & { _repo?: string })._repo;
    return allExistingTasks.some(
      (task) => task.url === pr.html_url || 
        (task.type === "pr" && task.repoFullName === repo && task.number === pr.number)
    );
  };

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
      assignee: currentAssignee,
      reviewer: currentReviewer,
      labels: labelsEnabled
        ? labels.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
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
      assignee: currentAssignee,
      reviewer: currentReviewer,
      labels: labelsEnabled
        ? labels.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
    };
    onSavePreset(updatedPreset);
  };

  const handleDeletePreset = () => {
    if (activePresetId && confirm("このプリセットを削除しますか？")) {
      onDeletePreset(activePresetId);
    }
  };

  const handleSelectIssue = (issue: GitHubIssue) => {
    const repo = (issue as GitHubIssue & { _repo?: string })._repo || selectedRepos[0];
    onAddTask({
      id: generateId(),
      type: "issue",
      url: issue.html_url,
      title: `#${issue.number} ${issue.title}`,
      repoFullName: repo,
      number: issue.number,
    }, addTarget);
  };

  const handleSelectPR = (pr: GitHubPullRequest) => {
    const repo = (pr as GitHubPullRequest & { _repo?: string })._repo || selectedRepos[0];
    onAddTask({
      id: generateId(),
      type: "pr",
      url: pr.html_url,
      title: `#${pr.number} ${pr.title}`,
      repoFullName: repo,
      number: pr.number,
    }, addTarget);
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const isUrl = customText.startsWith("http://") || customText.startsWith("https://");
    onAddTask({
      id: generateId(),
      type: "custom",
      url: isUrl ? customText : undefined,
      title: customText,
    }, addTarget);
    setCustomText("");
  };

  const currentLabels = labelsEnabled
    ? labels.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  const hasChanges =
    activePreset &&
    (JSON.stringify(selectedRepos) !== JSON.stringify(activePreset.repos) ||
      state !== activePreset.state ||
      currentAssignee !== activePreset.assignee ||
      currentReviewer !== activePreset.reviewer ||
      JSON.stringify(currentLabels) !== JSON.stringify(activePreset.labels));

  const getTasksForTarget = (target: AddTarget) => {
    switch (target) {
      case "tasks": return existingTasks;
      case "doneTasks": return existingDoneTasks;
      case "nextTasks": return existingNextTasks;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column: Filter Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
            <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h2 className="font-medium text-sm">フィルター設定</h2>
        </div>

        <div className="space-y-5 p-5 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
          {/* Preset selector */}
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
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {activePreset && (
              <button
                onClick={handleDeletePreset}
                className="p-2.5 rounded-xl border-2 border-[var(--border)] text-[var(--muted)] hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                title="プリセットを削除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Repository selection */}
          <div>
            <label className="block text-sm font-medium mb-2">リポジトリ</label>
            <div className="relative mb-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="リポジトリを検索..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
              />
            </div>
            <div className="max-h-32 overflow-y-auto border-2 border-[var(--border)] rounded-xl bg-[var(--surface)]">
              {repos.length === 0 ? (
                <p className="text-sm text-[var(--muted)] p-4 text-center">ログインしてリポジトリを読み込み</p>
              ) : filteredRepos.length === 0 ? (
                <p className="text-sm text-[var(--muted)] p-4 text-center">該当するリポジトリがありません</p>
              ) : (
                filteredRepos.map((repo) => (
                  <label
                    key={repo.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--accent-soft)] cursor-pointer transition-colors duration-200 border-b border-[var(--border)] last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(repo.full_name)}
                      onChange={() => handleToggleRepo(repo.full_name)}
                      className="w-4 h-4 rounded border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                    />
                    <span className="text-sm truncate">{repo.full_name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* State & Assignee */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Issue/PRの状態</label>
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
                    {s === "open" ? "オープン" : s === "closed" ? "クローズ" : "すべて"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <input
                  type="checkbox"
                  checked={assigneeEnabled}
                  onChange={(e) => setAssigneeEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                />
                アサイニー
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="GitHubユーザー名"
                disabled={!assigneeEnabled}
                className={`w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200 ${!assigneeEnabled ? "opacity-50" : ""}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <input
                  type="checkbox"
                  checked={reviewerEnabled}
                  onChange={(e) => setReviewerEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                />
                レビュアー <span className="text-[var(--muted)] font-normal">(PR用)</span>
              </label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                placeholder="GitHubユーザー名"
                disabled={!reviewerEnabled}
                className={`w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200 ${!reviewerEnabled ? "opacity-50" : ""}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <input
                  type="checkbox"
                  checked={labelsEnabled}
                  onChange={(e) => setLabelsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                />
                ラベル <span className="text-[var(--muted)] font-normal">(カンマ区切り)</span>
              </label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="bug, enhancement"
                disabled={!labelsEnabled}
                className={`w-full px-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200 ${!labelsEnabled ? "opacity-50" : ""}`}
              />
            </div>
          </div>

          {/* Preset actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
            {activePreset && hasChanges && (
              <button
                onClick={handleUpdatePreset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                更新
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
                  onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSaveAsPreset()}
                />
                <button
                  onClick={handleSaveAsPreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--accent)] to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存
                </button>
                <button
                  onClick={() => { setShowSaveDialog(false); setPresetName(""); }}
                  className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={selectedRepos.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規保存
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center Column: Issue/PR List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
            <svg className="w-3 h-3 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="font-medium text-sm">Issue / PR</h2>
        </div>

        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
          {/* Custom text input */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="カスタム入力..."
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleAddCustom()}
              />
              <button
                onClick={handleAddCustom}
                disabled={!customText.trim()}
                className="px-3 py-2 text-sm font-medium text-white rounded-lg bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                追加
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
          {/* Tab switcher */}
          <div className="flex border-b border-[var(--border)] mb-4">
            {(["issue", "pr"] as ResultTabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setResultTab(tab)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                  resultTab === tab
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab === "issue" ? `Issue (${filteredIssues.length})` : `PR (${filteredPRs.length})`}
                {resultTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-full pl-11 pr-4 py-2.5 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
            />
          </div>

          {/* Results list */}
          <div className="max-h-[400px] overflow-y-auto -mx-2 px-2 space-y-2">
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted)] mt-3">読み込み中...</p>
              </div>
            ) : !accessToken ? (
              <div className="py-12 text-center">
                <p className="text-[var(--muted)]">ログインしてください</p>
              </div>
            ) : selectedRepos.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[var(--muted)]">リポジトリを選択してください</p>
              </div>
            ) : resultTab === "issue" ? (
              filteredIssues.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[var(--muted)]">Issueがありません</p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const added = isIssueAdded(issue);
                  const repo = (issue as GitHubIssue & { _repo?: string })._repo;
                  return (
                    <div
                      key={`${repo}-${issue.id}`}
                      className={`p-3 rounded-xl border transition-all duration-200 ${
                        added
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60"
                          : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => !added && handleSelectIssue(issue)}
                          disabled={added}
                          className={`flex-1 text-left ${added ? "cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                              added
                                ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                                : "bg-[var(--background)] text-[var(--accent)]"
                            }`}>
                              #{issue.number}
                            </span>
                            {added && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                追加済み
                              </span>
                            )}
                            {!added && issue.labels.slice(0, 2).map((label) => (
                              <span
                                key={label.name}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{issue.title}</p>
                        </button>
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--background)] transition-colors"
                          title="GitHubで開く"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                        {issue.assignee ? (
                          <div className="flex items-center gap-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={issue.assignee.avatar_url} alt={issue.assignee.login} className="w-4 h-4 rounded-full" />
                            <span>{issue.assignee.login}</span>
                          </div>
                        ) : issue.user ? (
                          <div className="flex items-center gap-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={issue.user.avatar_url} alt={issue.user.login} className="w-4 h-4 rounded-full" />
                            <span className="opacity-60">by {issue.user.login}</span>
                          </div>
                        ) : null}
                        <span className="opacity-60">{repo?.split("/")[1]}</span>
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredPRs.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[var(--muted)]">Pull Requestがありません</p>
              </div>
            ) : (
              filteredPRs.map((pr) => {
                const added = isPRAdded(pr);
                const repo = (pr as GitHubPullRequest & { _repo?: string })._repo;
                return (
                  <div
                    key={`${repo}-${pr.id}`}
                    className={`p-3 rounded-xl border transition-all duration-200 ${
                      added
                        ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60"
                        : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => !added && handleSelectPR(pr)}
                        disabled={added}
                        className={`flex-1 text-left ${added ? "cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            added
                              ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                              : "bg-[var(--background)] text-[var(--accent)]"
                          }`}>
                            #{pr.number}
                          </span>
                          {added && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              追加済み
                            </span>
                          )}
                          {!added && pr.draft && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Draft</span>
                          )}
                          {!added && pr.labels.slice(0, 2).map((label) => (
                            <span
                              key={label.name}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{pr.title}</p>
                      </button>
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--background)] transition-colors"
                        title="GitHubで開く"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                      {pr.assignee ? (
                        <div className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pr.assignee.avatar_url} alt={pr.assignee.login} className="w-4 h-4 rounded-full" />
                          <span>{pr.assignee.login}</span>
                        </div>
                      ) : pr.user ? (
                        <div className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded-full" />
                          <span className="opacity-60">by {pr.user.login}</span>
                        </div>
                      ) : null}
                      <span className="opacity-60">{repo?.split("/")[1]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Right Column: Current Tasks */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-[var(--accent)] to-orange-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="font-medium text-sm">追加先</h2>
        </div>

        <div className="p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)] space-y-3">
          {(["tasks", "doneTasks", "nextTasks"] as AddTarget[]).map((target) => {
            const tasks = getTasksForTarget(target);
            const isActive = addTarget === target;
            return (
              <div
                key={target}
                className={`rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                }`}
              >
                <button
                  onClick={() => onAddTargetChange(target)}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left ${
                    isActive ? "font-medium text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                >
                  <span className="text-sm">{TARGET_LABELS[target]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}>
                    {tasks.length}
                  </span>
                </button>
                {tasks.length > 0 && (
                  <ul className="px-3 pb-2 space-y-1">
                    {tasks.slice(0, 5).map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-2 text-xs group"
                      >
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 bg-[var(--surface)]">
                          {task.type === "issue" && (
                            <svg className="w-2.5 h-2.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
                            </svg>
                          )}
                          {task.type === "pr" && (
                            <svg className="w-2.5 h-2.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                            </svg>
                          )}
                          {task.type === "custom" && (
                            <svg className="w-2.5 h-2.5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </div>
                        <span className="truncate flex-1 text-[var(--foreground)]">{task.title}</span>
                        <button
                          onClick={() => onRemoveTask(task.id, target)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted)] hover:text-red-500 transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                    {tasks.length > 5 && (
                      <li className="text-xs text-[var(--muted)] pl-6">
                        +{tasks.length - 5} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
