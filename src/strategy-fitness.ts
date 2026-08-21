export interface StrategyOutcome {
  strategyId: string;
  verified: boolean;
  value: number;
  cost: number;
}

export interface StrategyFitness {
  strategyId: string;
  attempts: number;
  successes: number;
  totalValue: number;
  totalCost: number;
  fitness: number;
}

/** Deterministic fitness: only verified value contributes; cost is always charged. */
export class StrategyFitnessLedger {
  private readonly entries = new Map<string, StrategyFitness>();

  record(outcome: StrategyOutcome): StrategyFitness {
    const previous = this.entries.get(outcome.strategyId) ?? {
      strategyId: outcome.strategyId,
      attempts: 0,
      successes: 0,
      totalValue: 0,
      totalCost: 0,
      fitness: 0
    };
    const totalValue = previous.totalValue + (outcome.verified ? Math.max(0, outcome.value) : 0);
    const totalCost = previous.totalCost + Math.max(0, outcome.cost);
    const attempts = previous.attempts + 1;
    const successes = previous.successes + (outcome.verified ? 1 : 0);
    const fitness = (totalValue - totalCost) / Math.max(1, attempts);
    const next = { ...previous, attempts, successes, totalValue, totalCost, fitness };
    this.entries.set(outcome.strategyId, next);
    return next;
  }

  get(strategyId: string): StrategyFitness | undefined {
    return this.entries.get(strategyId);
  }

  ranked(): StrategyFitness[] {
    return [...this.entries.values()].sort((a, b) => b.fitness - a.fitness);
  }
}
