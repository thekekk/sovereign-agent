export interface IssueSummary {
  id: number;
  title: string;
  body: string;
  url: string;
}

export interface PullRequestSummary {
  id: number;
  number: number;
  title: string;
  url: string;
}

/** Provider-neutral GitHub automation interface. Real token/API transport stays behind this boundary. */
export interface GitHubAdapter {
  listIssues(repo: string, state?: 'open' | 'closed'): Promise<IssueSummary[]>;
  createBranch(repo: string, name: string, base: string): Promise<void>;
  commitFiles(repo: string, branch: string, files: Record<string, string>, message: string): Promise<string>;
  createPullRequest(repo: string, branch: string, base: string, title: string, body?: string): Promise<PullRequestSummary>;
}

export class DisabledGitHubAdapter implements GitHubAdapter {
  async listIssues(): Promise<IssueSummary[]> { throw new Error('GitHub adapter not configured'); }
  async createBranch(): Promise<void> { throw new Error('GitHub adapter not configured'); }
  async commitFiles(): Promise<string> { throw new Error('GitHub adapter not configured'); }
  async createPullRequest(): Promise<PullRequestSummary> { throw new Error('GitHub adapter not configured'); }
}
