import type { SurvivalDecision, SurvivalSnapshot } from './survival.js';

export interface EconomicPolicy {
  reserveHours: number;
  maxWorkerShare: number;
  minReplicationRunway: number;
  maxWorkers: number;
}

export interface Allocation {
  survivalReserve: number;
  operatingBudget: number;
  replicationBudget: number;
  approved: boolean;
  reason: string;
}

export class EconomyEngine {
  constructor(private readonly policy: EconomicPolicy = {
    reserveHours: 24,
    maxWorkerShare: 0.25,
    minReplicationRunway: 48,
    maxWorkers: 4
  }) {}

  allocate(snapshot: SurvivalSnapshot, decision: SurvivalDecision, workers: number): Allocation {
    const reserve = Math.max(0, snapshot.computeCostPerHour * this.policy.reserveHours);
    const free = Math.max(0, snapshot.balance - reserve);

    if (decision.state === 'dead' || decision.priority !== 'grow') {
      return { survivalReserve: reserve, operatingBudget: free, replicationBudget: 0, approved: false, reason: 'Preserve runway before expansion' };
    }

    if (decision.runwayHours < this.policy.minReplicationRunway) {
      return { survivalReserve: reserve, operatingBudget: free, replicationBudget: 0, approved: false, reason: 'Insufficient runway for replication' };
    }

    if (workers >= this.policy.maxWorkers) {
      return { survivalReserve: reserve, operatingBudget: free, replicationBudget: 0, approved: false, reason: 'Worker cap reached' };
    }

    const replicationBudget = free * this.policy.maxWorkerShare;
    return {
      survivalReserve: reserve,
      operatingBudget: Math.max(0, free - replicationBudget),
      replicationBudget,
      approved: replicationBudget > 0,
      reason: replicationBudget > 0 ? 'Positive economics and runway support bounded replication' : 'No free capital available'
    };
  }
}
