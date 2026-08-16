import { GitHubEvidenceAdapter, type GitHubRunEvidenceInput } from './github-evidence.js';
import { TaskEconomics, type TaskEconomicsInput } from './task-economics.js';
import type { OutcomeLedger } from './outcome-ledger.js';

export interface VerifiedGitHubOutcome {
  verified: boolean;
  value: number;
  netValue: number;
  profitable: boolean;
  reason: string;
}

/** Converts independently verified GitHub CI outcomes into economic outcomes. */
export class GitHubEvidenceLedger {
  constructor(
    private readonly adapter = new GitHubEvidenceAdapter(),
    private readonly economics = new TaskEconomics(),
    private readonly ledger?: OutcomeLedger
  ) {}

  record(input: GitHubRunEvidenceInput, task: TaskEconomicsInput): VerifiedGitHubOutcome {
    const result = this.adapter.verify(input);
    const economicInput: TaskEconomicsInput = {
      ...task,
      value: result.verified ? task.value : 0,
      success: result.verified,
      source: 'github-actions',
      metadata: {
        ...(task.metadata ?? {}),
        verified: result.verified,
        runId: input.runId,
        workflow: input.workflow,
        sourceCommit: input.sourceCommit,
        reason: result.reason
      }
    };
    const economics = this.economics.record(economicInput);

    if (this.ledger) {
      this.ledger.record(economics.event);
    }

    return {
      verified: result.verified,
      value: economicInput.value,
      netValue: economics.netValue,
      profitable: economics.profitable,
      reason: result.reason
    };
  }
}
