export interface PullRequestCreator {
  createPullRequest(input: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft: true;
    maintainerCanModify: false;
  }): Promise<{ number: number; url: string }>;
}

export interface DraftPrRequest {
  title: string;
  body: string;
  head: string;
  base: string;
  testsPassed: boolean;
  sourceCommit: string;
}

/**
 * Final GitHub hand-off boundary. It can create only a draft PR after local
 * verification; it never merges, closes, force-pushes, or enables maintainer edits.
 */
export class GitHubDraftPrAutomation {
  constructor(private readonly github: PullRequestCreator) {}

  async createVerifiedDraft(input: DraftPrRequest): Promise<{ number: number; url: string }> {
    if (!input.testsPassed) throw new Error('verified tests are required before creating a draft PR');
    if (!input.title.trim() || !input.body.trim()) throw new Error('PR title and body are required');
    if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(input.head)) throw new Error('invalid autonomous head branch');
    if (!/^[a-zA-Z0-9._/-]+$/.test(input.base) || input.base.startsWith('-')) throw new Error('invalid base branch');
    if (!/^[0-9a-f]{40}$/.test(input.sourceCommit)) throw new Error('source commit must be a full SHA-1');

    return this.github.createPullRequest({
      title: input.title.trim(),
      body: `${input.body.trim()}\n\nSource commit: ${input.sourceCommit}`,
      head: input.head,
      base: input.base,
      draft: true,
      maintainerCanModify: false
    });
  }
}
