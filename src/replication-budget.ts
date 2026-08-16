import type { SurvivalDecision } from './survival.js';

export interface ReplicationBudget {
  available: boolean;
  maxWorkers: number;
  perWorkerBudget: number;
  reason: string;
}

export interface ReplicationConfig {
  reserveHours: number;
  maxWorkers: number;
  workerCostPerHour: number;
}

/** Converts survival state into a bounded replication allowance. */
export class ReplicationBudgetEngine {
  constructor(private readonly config: ReplicationConfig = {
    reserveHours: 24,
    maxWorkers: 3,
    workerCostPerHour: 0.25
  }) {}

  calculate(survival: SurvivalDecision): ReplicationBudget {
    if (survival.priority !== 'grow') {
      return { available: false, maxWorkers: 0, perWorkerBudget: 0, reason: 'Growth is not the current survival priority' };
    }

    if (!Number.isFinite(survival.runwayHours) || survival.runwayHours <= this.config.reserveHours) {
      return { available: false, maxWorkers: 0, perWorkerBudget: 0, reason: 'Insufficient runway above reserve requirement' };
    }

    const surplusHours = survival.runwayHours - this.config.reserveHours;
    const affordable = Math.floor(surplusHours / 4);
    const maxWorkers = Math.min(this.config.maxWorkers, Math.max(0, affordable));
    return {
      available: maxWorkers > 0,
      maxWorkers,
      perWorkerBudget: maxWorkers > 0 ? maxWorkers * this.config.workerCostPerHour : 0,
      reason: maxWorkers > 0 ? 'Positive economics with reserve preserved' : 'Surplus runway too small for a worker'
    };
  }
}
