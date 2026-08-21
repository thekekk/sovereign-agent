import type { OpportunityAdapter, OpportunityDomain } from './opportunity-bus.js';
import type { OpportunityExecutor } from './opportunity-execution-result.js';

export interface OpportunityDomainAdapter {
  readonly domain: OpportunityDomain;
  readonly discovery: OpportunityAdapter;
  readonly executor: OpportunityExecutor;
}

export class OpportunityDomainAdapterRegistry {
  private readonly adapters = new Map<OpportunityDomain, OpportunityDomainAdapter>();

  register(adapter: OpportunityDomainAdapter): void {
    if (this.adapters.has(adapter.domain)) throw new Error(`domain adapter already registered: ${adapter.domain}`);
    if (adapter.discovery.domain !== adapter.domain || adapter.executor.domain !== adapter.domain) {
      throw new Error(`domain adapter components disagree: ${adapter.domain}`);
    }
    this.adapters.set(adapter.domain, adapter);
  }

  get(domain: OpportunityDomain): OpportunityDomainAdapter | undefined { return this.adapters.get(domain); }
  all(): readonly OpportunityDomainAdapter[] { return [...this.adapters.values()]; }
}
