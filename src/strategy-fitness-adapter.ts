import { StrategyFitnessLedger, type StrategyOutcome } from './strategy-fitness.js';
import type { StrategyExperience } from './strategy-learning.js';

/** Single source of truth for recorded strategy outcomes; exposes the shape StrategyLearning consumes. */
export class StrategyFitnessAdapter {
  constructor(private readonly ledger: StrategyFitnessLedger) {}

  record(outcome: StrategyOutcome): StrategyExperience {
    const fitness = this.ledger.record(outcome);
    return {
      strategy: fitness.strategyId,
      attempts: fitness.attempts,
      successes: fitness.successes,
      totalValue: fitness.totalValue,
      totalCost: fitness.totalCost
    };
  }

  experiences(): StrategyExperience[] {
    return this.ledger.ranked().map(fitness => ({
      strategy: fitness.strategyId,
      attempts: fitness.attempts,
      successes: fitness.successes,
      totalValue: fitness.totalValue,
      totalCost: fitness.totalCost
    }));
  }
}
