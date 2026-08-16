import type { StrategyDecision } from './strategy-controller.js';
import type { GitCheckpoint, GitCheckpointController } from './git-checkpoint.js';
import type { OutcomeLedger } from './outcome-ledger.js';
import type { ToolContext } from './types.js';

export interface RecoveryResult {
  action: StrategyDecision['action'];
  rolledBack: boolean;
  checkpoint?: GitCheckpoint;
  cost: number;
  reason: string;
}

/** Executes the bounded recovery decision and records its operational cost. */
export class RecoveryController {
  constructor(
    private readonly git: GitCheckpointController,
    private readonly ledger: OutcomeLedger
  ) {}

  async execute(
    decision: StrategyDecision,
    checkpoint: GitCheckpoint | undefined,
    context: ToolContext,
    taskId: string,
    cost = 0
  ): Promise<RecoveryResult> {
    if (decision.action !== 'recover') {
      return { action: decision.action, rolledBack: false, checkpoint, cost: 0, reason: 'Recovery not requested' };
    }

    if (!checkpoint) {
      this.ledger.record({ taskId, kind: 'failure', durationMs: 0, cost, value: 0, source: 'recovery', metadata: { action: 'recover', rolledBack: false } });
      return { action: decision.action, rolledBack: false, cost, reason: 'Recovery requested but no checkpoint is available' };
    }

    const started = Date.now();
    const result = await this.git.rollback(checkpoint, context);
    const durationMs = Date.now() - started;
    this.ledger.record({
      taskId,
      kind: result.ok ? 'success' : 'failure',
      durationMs,
      cost,
      value: 0,
      source: 'recovery',
      metadata: { action: 'recover', rolledBack: result.ok }
    });

    return {
      action: decision.action,
      rolledBack: result.ok,
      checkpoint,
      cost,
      reason: result.ok ? 'Rolled back to last known checkpoint' : `Rollback failed: ${result.output.slice(0, 1000)}`
    };
  }
}
