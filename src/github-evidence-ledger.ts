import { GitHubEvidenceAdapter, type GitHubRunEvidenceInput } from './github-evidence.js';
import { TaskEconomics, type TaskEconomicInput } from './task-economics.js';
import type { OutcomeLedger } from './outcome-ledger.js';

export interface VerifiedGitHubOutcome {
  verified: boolean;
  value: number;
  reason: string;
}

/** Converts independently verified GitHub CI outcomes into ledger economics. */
export class GitHubEvidenceLedger {
  constructor(
    private readonly adapter = new GitHubEvidenceAdapter(),
    private readonly economics = new TaskEconomics(),
    private readonly ledger?: OutcomeLedger
  ) {}

  record(input: GitHubRunEvidenceInput, task: TaskEconomicInput): VerifiedGitHubOutcome {
    const result = this.adapter.verify(input);
    const value = result.verified ? this.economics.calculate(task).value : 0;

    if (this.ledger) {
      this.ledger.record({
        taskId: task.taskId,
        kind: result.verified ? 'success' : 'failure',
        durationMs: task.finishedAt - task.startedAt,
        cost: task.computeRatePerMs * Math.max(0, task.finishedAt - task.startedAt),
        value,
        source: 'github-actions',
        metadata: {
          verified: result.verified,
          runId: input.runId,
          workflow: input.workflow,
          sourceCommit: input.sourceCommit,
          reason: result.reason
        }
      });
    }

    return { verified: result.verified, value, reason: result.reason };
  }
}
