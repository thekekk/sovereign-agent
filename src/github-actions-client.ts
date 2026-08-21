import type { WorkflowRunClient, WorkflowRunObservation } from './github-child-ci-observer.js';
import type { GitHubBranchClient } from './github-branch-creator.js';
import type { PullRequestCreator } from './github-pr-automation.js';

export interface GitHubActionsClientConfig {
  token: string;
  owner: string;
  repo: string;
  apiBaseUrl?: string;
}

interface GitHubRunResponse {
  id: number;
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  head_sha?: string | null;
}

interface GitHubPullRequestResponse { number: number; html_url: string; }

/** Minimal native-fetch GitHub API adapter; no GitHub SDK is required. */
export class GitHubActionsClient implements WorkflowRunClient, GitHubBranchClient, PullRequestCreator {
  private readonly baseUrl: string;

  constructor(private readonly config: GitHubActionsClientConfig) {
    if (!config.token.trim()) throw new Error('GitHub token is required');
    if (!config.owner.trim() || !config.repo.trim()) throw new Error('GitHub owner and repo are required');
    this.baseUrl = (config.apiBaseUrl ?? 'https://api.github.com').replace(/\/$/, '');
  }

  async getRun(runId: number): Promise<WorkflowRunObservation> {
    const data = await this.request<GitHubRunResponse>(`/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/actions/runs/${runId}`);
    const headSha = data.head_sha ?? '';
    return { runId: data.id, workflow: data.name ?? 'unknown', status: data.status ?? 'unknown', conclusion: this.normalizeConclusion(data.conclusion), headSha, sourceCommit: headSha };
  }

  async createBranch(branch: string, sha: string): Promise<void> {
    if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(branch)) throw new Error('invalid lineage branch');
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('branch source must be a full SHA-1');
    await this.request(`/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }) });
  }

  async createPullRequest(input: { title: string; body: string; head: string; base: string; draft: true; maintainerCanModify: false }): Promise<{ number: number; url: string }> {
    if (!input.draft || input.maintainerCanModify) throw new Error('only non-editable draft PRs are permitted');
    if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(input.head)) throw new Error('invalid lineage branch');
    const data = await this.request<GitHubPullRequestResponse>(`/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}/pulls`, {
      method: 'POST', body: JSON.stringify({ title: input.title, body: input.body, head: input.head, base: input.base, draft: true, maintainer_can_modify: false })
    });
    return { number: data.number, url: data.html_url };
  }

  private normalizeConclusion(value: string | null | undefined): WorkflowRunObservation['conclusion'] {
    if (value === 'success' || value === 'failure' || value === 'cancelled' || value === 'neutral') return value;
    return 'unknown';
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.config.token}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
    if (!response.ok) { const body = await response.text(); throw new Error(`GitHub API ${response.status}: ${body.slice(0, 500)}`); }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
