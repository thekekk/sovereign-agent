import { StrategyController, type StrategyDecision } from './strategy-controller.js';
import { PopulationController, type PopulationDecision, type PopulationState } from './population.js';
import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';

export interface EvolutionInput {
  population: PopulationState;
  outcomes: OutcomeSummary;
  survival: SurvivalSnapshot;
}

export interface EvolutionDecision {
  strategy: StrategyDecision;
  population: PopulationDecision;
  reproduce: boolean;
  reason: string;
}

/**
 * Single policy gate for an evolutionary generation. It never creates a child
 * itself; it only decides whether the already-bounded population/lineage layer
 * may attempt reproduction.
 */
export class EvolutionController {
  constructor(
    private readonly strategy = new StrategyController(),
    private readonly population = new PopulationController()
  ) {}

  decide(input: EvolutionInput): EvolutionDecision {
    const strategy = this.strategy.decide(input.outcomes, input.survival);
    const population = this.population.decide({
      ...input.population,
      fitness: strategy.fitness.score,
      balance: input.survival.balance
    });

    const reproduce = strategy.survival.priority === 'grow' && population.action === 'replicate';
    return {
      strategy,
      population,
      reproduce,
      reason: reproduce
        ? 'Verified positive fitness and healthy runway permit a bounded reproduction attempt'
        : 'Current evidence does not authorize reproduction'
    };
  }
}
