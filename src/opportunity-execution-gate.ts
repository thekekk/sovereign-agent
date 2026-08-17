import type { Opportunity, WalletCapability } from './opportunity-bus.js';

export type ExecutionDecision = 'execute' | 'watch' | 'skip';

export interface ExecutionRequest {
  opportunity: Opportunity;
  wallet: WalletCapability;
  now?: number;
}

export interface ExecutionAuthorization {
  decision: ExecutionDecision;
  reason: string;
  opportunityId: string;
}

export class OpportunityExecutionGate {
  authorize(request: ExecutionRequest): ExecutionAuthorization {
    const { opportunity, wallet } = request;
    if (!wallet.canExecute) return this.skip(opportunity, 'wallet execution is disabled');
    if (!wallet.domains.includes(opportunity.domain)) return this.skip(opportunity, 'wallet does not support opportunity domain');
    if (opportunity.requiredService && !wallet.services.includes(opportunity.requiredService)) {
      return this.skip(opportunity, 'wallet has no compatible service adapter');
    }
    if (opportunity.estimatedValue <= opportunity.estimatedCost) return this.skip(opportunity, 'expected value does not exceed cost');
    if (opportunity.risk >= 0.9) return this.skip(opportunity, 'risk exceeds hard execution ceiling');
    const confidence = opportunity.evidence.length
      ? Math.max(...opportunity.evidence.map(e => e.confidence))
      : 0;
    if (confidence < 0.55) return { decision: 'watch', reason: 'evidence is insufficient for execution', opportunityId: opportunity.id };
    return { decision: 'execute', reason: 'capability, economics, risk and evidence gates passed', opportunityId: opportunity.id };
  }

  private skip(opportunity: Opportunity, reason: string): ExecutionAuthorization {
    return { decision: 'skip', reason, opportunityId: opportunity.id };
  }
}
