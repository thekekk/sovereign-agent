import type { Opportunity, OpportunityDomain, WalletCapability } from './opportunity-bus.js';

export interface WalletServiceRule {
  service: string;
  domains: readonly OpportunityDomain[];
  enabled: boolean;
}

export interface WalletServiceDecision {
  allowed: boolean;
  reason: string;
}

export class WalletServiceMatrix {
  constructor(private readonly rules: readonly WalletServiceRule[]) {}

  canUse(wallet: WalletCapability, opportunity: Opportunity): WalletServiceDecision {
    if (!wallet.canExecute) return { allowed: false, reason: 'wallet execution disabled' };
    if (!wallet.domains.includes(opportunity.domain)) return { allowed: false, reason: 'wallet does not support opportunity domain' };
    if (!opportunity.requiredService) return { allowed: true, reason: 'no specific service required' };
    if (!wallet.services.includes(opportunity.requiredService)) return { allowed: false, reason: 'wallet lacks required service' };
    const rule = this.rules.find(item => item.service === opportunity.requiredService);
    if (!rule?.enabled) return { allowed: false, reason: 'required service is not enabled' };
    if (!rule.domains.includes(opportunity.domain)) return { allowed: false, reason: 'service is not enabled for this domain' };
    return { allowed: true, reason: 'wallet and service capabilities match' };
  }
}
