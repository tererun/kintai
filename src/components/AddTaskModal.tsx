'use client';

import { useState, useEffect } from 'react';
import { TaskItem, GitHubIssue, GitHubPullRequest, FilterPreset } from '@/types';
import { getIssues, getPullRequests } from '@/lib/github';
import { generateId } from '@/lib/storage';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: TaskItem) => void;
  accessToken: string | null;
  activePreset: FilterPreset | null;
  existingTasks: TaskItem[];
}

type TabType = 'issue' | 'pr' | 'custom';

export function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  accessToken,
  activePreset,
  existingTasks,
}: AddTaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('issue');
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');

  useEffect(() => {
    if (activePreset?.repos.length) {
      setSelectedRepo(activePreset.repos[0]);
    }
  }, [activePreset]);

  useEffect(() => {
    if (!isOpen || !accessToken || !selectedRepo) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'issue') {
          const data = await getIssues(accessToken, selectedRepo, activePreset?.state ?? 'open', activePreset?.assignee);
          setIssues(data);
        } else if (activeTab === 'pr') {
          const data = await getPullRequests(accessToken, selectedRepo, activePreset?.state ?? 'open', activePreset?.assignee);
          setPullRequests(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, accessToken, selectedRepo, activeTab, activePreset?.state, activePreset?.assignee]);

  const handleSelectIssue = (issue: GitHubIssue) => {
    onAdd({
      id: generateId(),
      type: 'issue',
      url: issue.html_url,
      title: `#${issue.number} ${issue.title}`,
      repoFullName: selectedRepo,
      number: issue.number,
    });
    onClose();
  };

  const handleSelectPR = (pr: GitHubPullRequest) => {
    onAdd({
      id: generateId(),
      type: 'pr',
      url: pr.html_url,
      title: `#${pr.number} ${pr.title}`,
      repoFullName: selectedRepo,
      number: pr.number,
    });
    onClose();
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const isUrl = customText.startsWith('http://') || customText.startsWith('https://');
    onAdd({
      id: generateId(),
      type: 'custom',
      url: isUrl ? customText : undefined,
      title: customText,
    });
    setCustomText('');
    onClose();
  };

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

  const isIssueAdded = (issue: GitHubIssue) => {
    return existingTasks.some(
      (task) => task.url === issue.html_url || 
        (task.type === 'issue' && task.repoFullName === selectedRepo && task.number === issue.number)
    );
  };

  const isPRAdded = (pr: GitHubPullRequest) => {
    return existingTasks.some(
      (task) => task.url === pr.html_url || 
        (task.type === 'pr' && task.repoFullName === selectedRepo && task.number === pr.number)
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-lg bg-[var(--surface)] rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 py-5 border-b border-[var(--border)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-50" />
          <div className="relative flex items-center justify-between">
            <h2 className="font-serif text-xl">タスクを追加</h2>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(['issue', 'pr', 'custom'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === tab
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab === 'issue' && 'Issue'}
              {tab === 'pr' && 'Pull Request'}
              {tab === 'custom' && 'カスタム'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'custom' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">テキストまたはURLを入力</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="例: ドキュメント整理 or https://..."
                  className="w-full px-4 py-3 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--background)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customText.trim()}
                className="w-full px-4 py-3 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--accent)] to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                追加する
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activePreset?.repos && activePreset.repos.length > 1 && (
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full px-4 py-3 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--background)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
                >
                  {activePreset.repos.map((repo) => (
                    <option key={repo} value={repo}>
                      {repo}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="検索..."
                  className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[var(--border)] rounded-xl bg-[var(--background)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
                />
              </div>

              <div className="max-h-72 overflow-y-auto -mx-2 px-2 space-y-2">
                {loading ? (
                  <div className="py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[var(--muted)] mt-3">読み込み中...</p>
                  </div>
                ) : !accessToken ? (
                  <div className="py-12 text-center">
                    <p className="text-[var(--muted)]">ログインしてください</p>
                  </div>
                ) : !selectedRepo ? (
                  <div className="py-12 text-center">
                    <p className="text-[var(--muted)]">リポジトリを選択してください</p>
                  </div>
                ) : activeTab === 'issue' ? (
                  filteredIssues.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-[var(--muted)]">Issueがありません</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue) => {
                      const added = isIssueAdded(issue);
                      return (
                        <div
                          key={issue.id}
                          className={`p-3 rounded-xl border transition-all duration-200 group ${
                            added 
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60' 
                              : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => !added && handleSelectIssue(issue)}
                              disabled={added}
                              className={`flex-1 text-left ${added ? 'cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                  added 
                                    ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300' 
                                    : 'bg-[var(--background)] text-[var(--accent)]'
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
                                    style={{
                                      backgroundColor: `#${label.color}20`,
                                      color: `#${label.color}`,
                                    }}
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
                              <img
                                src={issue.assignee.avatar_url}
                                alt={issue.assignee.login}
                                className="w-4 h-4 rounded-full"
                              />
                              <span>{issue.assignee.login}</span>
                            </div>
                          ) : issue.user ? (
                            <div className="flex items-center gap-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={issue.user.avatar_url}
                                alt={issue.user.login}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="opacity-60">by {issue.user.login}</span>
                            </div>
                          ) : null}
                          <span className="opacity-60">{selectedRepo.split('/')[1]}</span>
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
                    return (
                      <div
                        key={pr.id}
                        className={`p-3 rounded-xl border transition-all duration-200 group ${
                          added 
                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 opacity-60' 
                            : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => !added && handleSelectPR(pr)}
                            disabled={added}
                            className={`flex-1 text-left ${added ? 'cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                added 
                                  ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300' 
                                  : 'bg-[var(--background)] text-[var(--accent)]'
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
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  Draft
                                </span>
                              )}
                              {!added && pr.labels.slice(0, 2).map((label) => (
                                <span
                                  key={label.name}
                                  className="text-xs px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `#${label.color}20`,
                                    color: `#${label.color}`,
                                  }}
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
                            <img
                              src={pr.assignee.avatar_url}
                              alt={pr.assignee.login}
                              className="w-4 h-4 rounded-full"
                            />
                            <span>{pr.assignee.login}</span>
                          </div>
                        ) : pr.user ? (
                          <div className="flex items-center gap-1.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={pr.user.avatar_url}
                              alt={pr.user.login}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="opacity-60">by {pr.user.login}</span>
                          </div>
                        ) : null}
                        <span className="opacity-60">{selectedRepo.split('/')[1]}</span>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
