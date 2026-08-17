import type { OpportunityAdapter, OpportunityDomain, WalletCapability } from './opportunity-bus.js';

export interface RegisteredAdapter extends OpportunityAdapter {
  readonly service?: string;
  readonly enabled?: boolean;
}

export class OpportunityAdapterRegistry {
  private readonly adapters: RegisteredAdapter[] = [];

  register(adapter: RegisteredAdapter): void {
    if (this.adapters.some(item => item.domain === adapter.domain && item.service === adapter.service)) {
      throw new Error(`adapter already registered: ${adapter.domain}:${adapter.service ?? 'generic'}`);
    }
    this.adapters.push(adapter);
  }

  compatible(wallet: WalletCapability): readonly RegisteredAdapter[] {
    return this.adapters.filter(adapter =>
      adapter.enabled !== false &&
      wallet.canExecute &&
      wallet.domains.includes(adapter.domain) &&
      (!adapter.service || wallet.services.includes(adapter.service))
    );
  }

  domains(): readonly OpportunityDomain[] {
    return [...new Set(this.adapters.filter(a => a.enabled !== false).map(a => a.domain))];
  }
}
