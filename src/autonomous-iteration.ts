import { StrategyController, type StrategyDecision } from './strategy-controller.js';
import { TaskEconomics, type TaskEconomicsResult } from './task-economics.js';
import { GitCheckpointController, type GitCheckpoint } from './git-checkpoint.js';
import { RecoveryController, type RecoveryResult } from './recovery-controller.js';
import type { OutcomeLedger } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';
import type { ToolContext } from './types.js';

export interface AutonomousIterationInput {
  taskId: string;
  taskValue: number;
  costPerHour: number;
  survival: SurvivalSnapshot;
  checkpointLabel?: string;
  work: () => Promise<{ success: boolean; value?: number; metadata?: Record<string, string | number | boolean> }>;
}

export interface AutonomousIterationResult {
  checkpoint: GitCheckpoint;
  workSuccess: boolean;
  economics: TaskEconomicsResult;
  decision: StrategyDecision;
  recovery?: RecoveryResult;
}

/**
 * One bounded engineering cycle. The orchestrator never selects tools or
 * permissions itself; those remain behind the executor/policy boundaries.
 */
export class AutonomousIteration {
  private readonly strategy: StrategyController;
  private readonly economics: TaskEconomics;
  private readonly recovery: RecoveryController;

  constructor(
    private readonly git: GitCheckpointController,
    ledger: OutcomeLedger,
    strategy = new StrategyController(),
  ) {
    this.strategy = strategy;
    this.economics = new TaskEconomics(ledger);
    this.recovery = new RecoveryController(git, ledger);
  }

  async run(input: AutonomousIterationInput, context: ToolContext): Promise<AutonomousIterationResult> {
    const checkpoint = await this.git.checkpoint(
      input.checkpointLabel ?? `pre-task:${input.taskId}`,
      context
    );

    const startedAtMs = Date.now();
    const work = await input.work();
    const finishedAtMs = Date.now();
    const economics = this.economics.record({
      taskId: input.taskId,
      startedAtMs,
      finishedAtMs,
      costPerHour: input.costPerHour,
      value: work.value ?? input.taskValue,
      success: work.success,
      source: 'autonomous-iteration',
      metadata: work.metadata
    });

    const summary = this.economics.summary();
    const decision = this.strategy.decide(summary, input.survival);
    const recovery = decision.action === 'recover'
      ? await this.recovery.execute(decision, checkpoint, context, input.taskId, economics.event.cost)
      : undefined;

    return { checkpoint, workSuccess: work.success, economics, decision, recovery };
  }
}
