import type { OpportunityDomain, WalletCapability } from './opportunity-bus.js';

export interface ServiceCapability {
  service: string;
  domains: readonly OpportunityDomain[];
  enabled: boolean;
}

export class WalletCapabilityRegistry {
  constructor(private readonly capabilities: readonly ServiceCapability[]) {}

  forWallet(wallet: WalletCapability): readonly ServiceCapability[] {
    if (!wallet.canExecute) return [];
    return this.capabilities.filter(capability =>
      capability.enabled && wallet.services.includes(capability.service) &&
      capability.domains.some(domain => wallet.domains.includes(domain))
    );
  }

  supports(wallet: WalletCapability, service: string, domain: OpportunityDomain): boolean {
    return this.forWallet(wallet).some(capability => capability.service === service && capability.domains.includes(domain));
  }
}
