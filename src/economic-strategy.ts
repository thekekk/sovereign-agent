import { EconomyEngine, type Allocation } from './economy.js';
import { StrategyController, type StrategyDecision } from './strategy-controller.js';
import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';

export interface EconomicStrategyDecision extends StrategyDecision {
  allocation: Allocation;
  netValue: number;
  nextBudget: number;
}

/** Bridges durable task economics into bounded strategy selection. */
export class EconomicStrategyController {
  private readonly strategy = new StrategyController();
  private readonly economy = new EconomyEngine();

  decide(summary: OutcomeSummary, snapshot: SurvivalSnapshot, workers = 0): EconomicStrategyDecision {
    const base = this.strategy.decide(summary, snapshot);
    const allocation = this.economy.allocate(snapshot, base.survival, workers);
    const netValue = summary.totalValue - summary.totalCost;

    if (base.action === 'continue' && netValue < 0) {
      return {
        ...base,
        action: 'recover',
        allocation,
        netValue,
        nextBudget: allocation.operatingBudget,
        reason: 'Recover: recent work is economically negative'
      };
    }

    if (base.action === 'checkpoint' && !allocation.approved && base.survival.priority === 'grow') {
      return {
        ...base,
        action: 'continue',
        allocation,
        netValue,
        nextBudget: allocation.operatingBudget,
        reason: 'Continue conservatively: growth is not economically funded yet'
      };
    }

    return {
      ...base,
      allocation,
      netValue,
      nextBudget: allocation.operatingBudget
    };
  }
}
