import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { WalletServiceMatrix } from './wallet-service-matrix.js';

export interface DecisionGateResult {
  allowed: boolean;
  opportunity: Opportunity;
  reason: string;
}

export class OpportunityDecisionGate {
  constructor(private readonly capabilities: WalletServiceMatrix) {}

  evaluate(opportunity: Opportunity, wallet: WalletCapability): DecisionGateResult {
    const decision = this.capabilities.canUse(wallet, opportunity);
    return { allowed: decision.allowed, opportunity, reason: decision.reason };
  }
}
