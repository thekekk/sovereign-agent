import { FitnessEngine, type FitnessScore } from './fitness.js';
import { SurvivalEngine, type SurvivalSnapshot, type SurvivalDecision } from './survival.js';
import type { OutcomeSummary } from './outcome-ledger.js';

export type CodingAction = 'continue' | 'recover' | 'checkpoint' | 'stop';

export interface StrategyDecision {
  action: CodingAction;
  fitness: FitnessScore;
  survival: SurvivalDecision;
  reason: string;
}

/**
 * Converts observed engineering outcomes and current resources into a bounded
 * next-step decision. This is deliberately a policy signal, not an escape
 * mechanism: it can stop or reduce work, but cannot widen tool permissions.
 */
export class StrategyController {
  private readonly fitness = new FitnessEngine();
  private readonly survival = new SurvivalEngine();

  decide(summary: OutcomeSummary, snapshot: SurvivalSnapshot): StrategyDecision {
    const fitness = this.fitness.score(summary);
    const survival = this.survival.evaluate(snapshot);

    if (survival.state === 'dead' || survival.priority === 'shutdown') {
      return { action: 'stop', fitness, survival, reason: 'Stop: survival policy requires shutdown' };
    }
    if (survival.priority === 'recover' || fitness.score < -0.2) {
      return { action: 'recover', fitness, survival, reason: 'Recover: resources or recent outcomes are deteriorating' };
    }
    if (fitness.score >= 0.6 && survival.priority === 'grow') {
      return { action: 'checkpoint', fitness, survival, reason: 'Checkpoint: reliable positive work should be preserved before another change' };
    }
    return { action: 'continue', fitness, survival, reason: 'Continue: current evidence supports another bounded iteration' };
  }
}
