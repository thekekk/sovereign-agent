import { describe, expect, it, vi } from 'vitest';
import { GitHubDraftPrAutomation } from './github-pr-automation.js';

describe('GitHubDraftPrAutomation', () => {
  const sourceCommit = 'a'.repeat(40);

  it('creates only a verified draft PR with maintainer edits disabled', async () => {
    const createPullRequest = vi.fn().mockResolvedValue({ number: 7, url: 'https://github.com/example/repo/pull/7' });
    const automation = new GitHubDraftPrAutomation({ createPullRequest });

    const result = await automation.createVerifiedDraft({
      title: 'Autonomous child result',
      body: 'CI verified the isolated child.',
      head: 'lineage/child-gen-2-child-7',
      base: 'main',
      testsPassed: true,
      sourceCommit
    });

    expect(result.number).toBe(7);
    expect(createPullRequest).toHaveBeenCalledWith({
      title: 'Autonomous child result',
      body: expect.stringContaining(sourceCommit),
      head: 'lineage/child-gen-2-child-7',
      base: 'main',
      draft: true,
      maintainerCanModify: false
    });
  });

  it('refuses a PR when verification did not pass', async () => {
    const createPullRequest = vi.fn();
    const automation = new GitHubDraftPrAutomation({ createPullRequest });

    await expect(automation.createVerifiedDraft({
      title: 'bad', body: 'bad', head: 'lineage/child-gen-2-child', base: 'main', testsPassed: false, sourceCommit
    })).rejects.toThrow('verified tests are required');
    expect(createPullRequest).not.toHaveBeenCalled();
  });

  it('rejects non-lineage autonomous branches', async () => {
    const createPullRequest = vi.fn();
    const automation = new GitHubDraftPrAutomation({ createPullRequest });

    await expect(automation.createVerifiedDraft({
      title: 'bad', body: 'bad', head: 'feat/unrestricted', base: 'main', testsPassed: true, sourceCommit
    })).rejects.toThrow('invalid autonomous head branch');
    expect(createPullRequest).not.toHaveBeenCalled();
  });
});
