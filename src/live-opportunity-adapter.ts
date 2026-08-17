import type { Opportunity, OpportunityAdapter, OpportunityDomain } from './opportunity-bus.js';
import type { OpportunitySource } from './opportunity-adapter-stubs.js';
import { normalizeOpportunity } from './live-opportunity-source.js';

export interface RawOpportunitySignal {
  id: string;
  venue: string;
  asset: string;
  estimatedValue: number;
  estimatedCost: number;
  risk: number;
  urgency: number;
  liquidity: number;
  source: string;
  signal: string;
  confidence: number;
  observedAt?: string;
  requiredService?: string;
}

export interface LiveDomainFeed {
  readonly domain: OpportunityDomain;
  fetch(signal: AbortSignal): Promise<readonly RawOpportunitySignal[]>;
}

export class LiveOpportunityAdapter implements OpportunityAdapter {
  constructor(readonly domain: OpportunityDomain, private readonly feed: LiveDomainFeed) {
    if (feed.domain !== domain) throw new Error('feed domain does not match adapter domain');
  }

  async discover(signal: AbortSignal): Promise<readonly Opportunity[]> {
    const raw = await this.feed.fetch(signal);
    return raw.map(item => normalizeOpportunity({
      ...item,
      domain: this.domain,
      observedAt: item.observedAt ?? new Date().toISOString()
    }));
  }
}

export class SourceOpportunityAdapter implements OpportunityAdapter {
  constructor(readonly domain: OpportunityDomain, private readonly source: OpportunitySource) {}
  discover(signal: AbortSignal): Promise<readonly Opportunity[]> { return this.source.discover(this.domain, signal); }
}
