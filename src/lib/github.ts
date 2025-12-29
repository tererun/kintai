import { GitHubRepo, GitHubIssue, GitHubPullRequest } from '@/types';

const GITHUB_API_BASE = 'https://api.github.com';

async function fetchGitHub<T>(endpoint: string, accessToken: string): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

export async function getRepos(accessToken: string): Promise<GitHubRepo[]> {
  return fetchGitHub<GitHubRepo[]>('/user/repos?per_page=100&sort=updated', accessToken);
}

export async function getIssues(
  accessToken: string,
  repoFullName: string,
  state: 'open' | 'closed' | 'all' = 'open',
  assignee?: string | null
): Promise<GitHubIssue[]> {
  let url = `/repos/${repoFullName}/issues?state=${state}&per_page=100`;
  if (assignee) {
    url += `&assignee=${encodeURIComponent(assignee)}`;
  }
  const issues = await fetchGitHub<GitHubIssue[]>(url, accessToken);
  return issues.filter((issue) => !issue.pull_request);
}

export async function getPullRequests(
  accessToken: string,
  repoFullName: string,
  state: 'open' | 'closed' | 'all' = 'open',
  assignee?: string | null
): Promise<GitHubPullRequest[]> {
  const prs = await fetchGitHub<GitHubPullRequest[]>(
    `/repos/${repoFullName}/pulls?state=${state}&per_page=100`,
    accessToken
  );
  // GitHub PR API doesn't support assignee filter, so filter client-side
  if (assignee) {
    return prs.filter((pr) => pr.assignee?.login === assignee);
  }
  return prs;
}
