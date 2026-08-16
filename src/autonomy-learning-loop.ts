import type { RecoveryRunner } from './recovery-runner.js';
import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';
import type { StrategyCandidate, StrategyExperience, LearnedStrategyDecision } from './strategy-learning.js';
import { StrategyLearningWithMemory } from './strategy-learning-with-memory.js';

export interface AutonomyLearningDecision extends LearnedStrategyDecision {
  allowed: boolean;
  reason: string;
}

/** Recovery remains authoritative; lineage learning only selects among work that is safe to attempt. */
export class AutonomyLearningLoop {
  constructor(
    private readonly recovery: Pick<RecoveryRunner, 'reconcile'>,
    private readonly learning: StrategyLearningWithMemory
  ) {}

  async decide(
    summary: OutcomeSummary,
    snapshot: SurvivalSnapshot,
    candidates: readonly StrategyCandidate[],
    experience: readonly StrategyExperience[],
    context = '*'
  ): Promise<AutonomyLearningDecision> {
    const recovery = await this.recovery.reconcile();
    if (!recovery.safeToContinue) {
      return {
        allowed: false,
        reason: `recovery required: ${recovery.reason}`,
        action: 'stop',
        selectedStrategy: null,
        confidence: 0
      };
    }

    const decision = this.learning.decide(summary, snapshot, candidates, experience, context);
    return {
      ...decision,
      allowed: decision.action !== 'stop',
      reason: decision.reason
    };
  }
}
