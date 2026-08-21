import { describe, expect, it } from 'vitest';
import { GitHubBranchCreator } from './github-branch-creator.js';
import { GitHubChildCiObserver, type WorkflowRunClient } from './github-child-ci-observer.js';

type DraftPrPlan = {
  base: string;
  head: string;
  draft: true;
  maintainerCanModify: false;
  sourceCommit: string;
};

function buildDraftPrPlan(base: string, head: string, sourceCommit: string, ci: { verified: boolean }): DraftPrPlan {
  if (!ci.verified) throw new Error('verified CI is required before PR handoff');
  if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(head)) throw new Error('invalid child lineage branch');
  return { base, head, draft: true, maintainerCanModify: false, sourceCommit };
}

const commit = '0123456789abcdef0123456789abcdef01234567';

describe('guarded lineage PR flow', () => {
  it('requires an exact child branch, verified CI, and produces draft-only PR metadata', async () => {
    let createdBranch = '';
    const branchCreator = new GitHubBranchCreator({
      async createBranch(branch, sha) { createdBranch = `${branch}:${sha}`; }
    });

    await branchCreator.create('lineage/child-gen-4-feature', commit);
    expect(createdBranch).toBe(`lineage/child-gen-4-feature:${commit}`);

    const github: WorkflowRunClient = {
      async getRun(runId) {
        return { runId, workflow: 'CI', status: 'completed', conclusion: 'success', headSha: commit, sourceCommit: commit };
      }
    };
    const ci = await new GitHubChildCiObserver(github).observe(247, commit);
    const plan = buildDraftPrPlan('feat/github-autonomy', 'lineage/child-gen-4-feature', commit, ci);

    expect(plan).toEqual({
      base: 'feat/github-autonomy',
      head: 'lineage/child-gen-4-feature',
      draft: true,
      maintainerCanModify: false,
      sourceCommit: commit
    });
  });

  it('refuses the PR handoff when CI is not verified', () => {
    expect(() => buildDraftPrPlan('feat/github-autonomy', 'lineage/child-gen-4-feature', commit, { verified: false }))
      .toThrow('verified CI is required before PR handoff');
  });

  it('does not allow a non-lineage branch into the autonomous handoff', () => {
    expect(() => buildDraftPrPlan('feat/github-autonomy', 'main', commit, { verified: true }))
      .toThrow('invalid child lineage branch');
  });
});
