import type { BranchCreator } from './child-provisioner.js';

export interface GitHubBranchClient {
  createBranch(branch: string, sha: string): Promise<void>;
}

/** Thin adapter: only creates a named child branch from an exact parent SHA. */
export class GitHubBranchCreator implements BranchCreator {
  constructor(private readonly github: GitHubBranchClient) {}

  async create(branch: string, parentCommit: string): Promise<void> {
    if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(branch)) throw new Error('invalid lineage branch');
    if (!/^[0-9a-f]{40}$/.test(parentCommit)) throw new Error('parent commit must be a full SHA-1');
    await this.github.createBranch(branch, parentCommit);
  }
}
