export interface TaskItem {
  id: string;
  type: 'issue' | 'pr' | 'custom';
  url?: string;
  title: string;
  repoFullName?: string;
  number?: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  repos: string[];
  state: 'open' | 'closed' | 'all';
  assignee: string | null;
  labels: string[];
}

export interface SavedSettings {
  filterPresets: FilterPreset[];
  activePresetId: string | null;
  timeInputMode: 'endTime' | 'duration';
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  labels: { name: string; color: string }[];
  assignee: { login: string; avatar_url: string } | null;
  user: { login: string; avatar_url: string } | null;
  pull_request?: object;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  assignee: { login: string; avatar_url: string } | null;
  labels: { name: string; color: string }[];
  draft?: boolean;
}
