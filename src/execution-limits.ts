import type { Opportunity } from './opportunity-bus.js';

export interface ExecutionLimits {
  maxEstimatedCost: number;
  maxEstimatedRisk: number;
}

export class ExecutionLimitsGuard {
  private readonly seen = new Set<string>();

  constructor(private readonly limits: ExecutionLimits) {}

  authorize(opportunity: Opportunity): { allowed: boolean; reason: string } {
    if (this.seen.has(opportunity.id)) return { allowed: false, reason: 'opportunity already processed' };
    if (opportunity.estimatedCost > this.limits.maxEstimatedCost) return { allowed: false, reason: 'estimated cost exceeds execution limit' };
    if (opportunity.risk > this.limits.maxEstimatedRisk) return { allowed: false, reason: 'risk exceeds execution limit' };
    return { allowed: true, reason: 'execution limits passed' };
  }

  markProcessed(opportunityId: string): void {
    this.seen.add(opportunityId);
  }
}
