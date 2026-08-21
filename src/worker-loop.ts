import type { OutcomeLedger, OutcomeEvent } from './outcome-ledger.js';
import { StrategyLearning, type StrategyCandidate, type StrategyExperience, type LearnedStrategyDecision } from './strategy-learning.js';
import type { SurvivalSnapshot } from './survival.js';
import type { StrategyFitnessAdapter } from './strategy-fitness-adapter.js';
import type { StrategyOutcomeToLineage } from './strategy-outcome-to-lineage.js';

export interface WorkerExecution {
  strategy: string;
  taskId: string;
  durationMs: number;
  cost: number;
  value: number;
  success: boolean;
  lesson: string;
}

export interface WorkerRunner {
  run(strategy: string): Promise<WorkerExecution>;
}

export interface WorkerLoopResult {
  decision: LearnedStrategyDecision;
  execution: WorkerExecution | null;
  outcome: OutcomeEvent | null;
}

/** One bounded learning iteration. External policy remains authoritative. */
export class WorkerLoop {
  constructor(
    private readonly learning = new StrategyLearning(),
    private readonly ledger: Pick<OutcomeLedger, 'record'>,
    private readonly fitness?: StrategyFitnessAdapter,
    private readonly lineage?: StrategyOutcomeToLineage,
    private readonly lineageContext = '*',
    private readonly originId = 'worker-loop'
  ) {}

  async run(
    summary: Parameters<StrategyLearning['decide']>[0],
    snapshot: SurvivalSnapshot,
    candidates: readonly StrategyCandidate[],
    experience: readonly StrategyExperience[],
    runner: WorkerRunner
  ): Promise<WorkerLoopResult> {
    const decision = this.learning.decide(summary, snapshot, candidates, experience, this.lineageContext);
    if (!decision.selectedStrategy || decision.action === 'stop') {
      return { decision, execution: null, outcome: null };
    }

    const execution = await runner.run(decision.selectedStrategy);
    const outcome = this.ledger.record({
      taskId: execution.taskId,
      kind: execution.success ? 'success' : 'failure',
      durationMs: execution.durationMs,
      cost: execution.cost,
      value: execution.value,
      source: 'worker-loop',
      metadata: {
        strategy: execution.strategy,
        lesson: execution.lesson,
        confidence: decision.confidence
      }
    });

    this.fitness?.record({
      strategyId: execution.strategy,
      verified: execution.success,
      value: execution.value,
      cost: execution.cost
    });

    this.lineage?.record({
      strategyId: execution.strategy,
      context: this.lineageContext,
      originId: this.originId,
      verified: execution.success,
      value: execution.value,
      lesson: execution.lesson
    });

    return { decision, execution, outcome };
  }
}
