import type { OutcomeSummary } from './outcome-ledger.js';

export interface FitnessScore {
  score: number;
  successRate: number;
  netValue: number;
  reason: string;
}

/** Converts observed outcomes into a bounded strategy signal. */
export class FitnessEngine {
  score(summary: OutcomeSummary): FitnessScore {
    const successComponent = summary.successRate * 0.7;
    const economicComponent = Math.max(-0.3, Math.min(0.3, summary.totalValue / Math.max(1, summary.totalCost + 1)));
    const score = Math.max(-1, Math.min(1, successComponent + economicComponent - 0.1 * Math.min(1, summary.failures / 10)));

    let reason = 'Insufficient outcome history';
    if (summary.successes + summary.failures > 0) {
      reason = score >= 0.6 ? 'Reliable and economically positive' : score >= 0 ? 'Viable but needs improvement' : 'Negative outcome trend; prefer recovery and lower-risk work';
    }

    return {
      score,
      successRate: summary.successRate,
      netValue: summary.totalValue - summary.totalCost,
      reason
    };
  }
}
