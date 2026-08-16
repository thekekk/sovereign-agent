export type ObservedConclusion = 'success' | 'failure' | 'cancelled' | 'neutral' | 'unknown';

export interface WorkflowRunObservation {
  runId: number;
  workflow: string;
  status: string;
  conclusion: ObservedConclusion;
  headSha: string;
  sourceCommit: string;
}

export interface WorkflowRunClient {
  getRun(runId: number): Promise<WorkflowRunObservation>;
}

export interface ChildCiObservation {
  runId: number;
  workflow: string;
  sourceCommit: string;
  conclusion: ObservedConclusion;
  verified: boolean;
  reason: string;
}

/** Converts GitHub's observed workflow-run state into a lifecycle-safe signal. */
export class GitHubChildCiObserver {
  constructor(private readonly github: WorkflowRunClient) {}

  async observe(runId: number, expectedSourceCommit: string): Promise<ChildCiObservation> {
    if (!Number.isInteger(runId) || runId <= 0) throw new Error('runId must be a positive integer');
    if (!/^[0-9a-f]{40}$/.test(expectedSourceCommit)) throw new Error('expected source commit must be a full SHA-1');

    const run = await this.github.getRun(runId);
    const provenanceMatches = run.sourceCommit === expectedSourceCommit && run.headSha === expectedSourceCommit;
    const completed = run.status === 'completed';
    const verified = completed && run.conclusion === 'success' && provenanceMatches;

    return {
      runId: run.runId,
      workflow: run.workflow,
      sourceCommit: run.sourceCommit,
      conclusion: run.conclusion,
      verified,
      reason: verified ? 'Completed successful run matches expected source commit' :
        !completed ? 'Workflow run has not completed' :
        !provenanceMatches ? 'Workflow provenance does not match expected child commit' :
        `Workflow conclusion is ${run.conclusion}`
    };
  }
}
