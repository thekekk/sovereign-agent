import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { DomainPolicyGate } from './domain-policy-gate.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';

export interface ExecutionSafetyDecision {
  allowed: boolean;
  reason: string;
}

export class ExecutionSafetyGate {
  constructor(
    private readonly domainPolicy: DomainPolicyGate,
    private readonly capabilityGate: OpportunityDecisionGate
  ) {}

  authorize(opportunity: Opportunity, wallet: WalletCapability): ExecutionSafetyDecision {
    if (!wallet.canExecute) return { allowed: false, reason: 'wallet execution disabled' };
    const domain = this.domainPolicy.evaluate(opportunity);
    if (!domain.allowed) return { allowed: false, reason: `domain policy: ${domain.reason}` };
    const capability = this.capabilityGate.evaluate(opportunity, wallet);
    if (!capability.allowed) return { allowed: false, reason: `wallet capability: ${capability.reason}` };
    return { allowed: true, reason: 'execution safety checks passed' };
  }
}
