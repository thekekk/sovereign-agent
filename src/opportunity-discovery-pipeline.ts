import type { Opportunity } from './opportunity-bus.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';

export interface DiscoveryPipelineResult {
  opportunities: readonly Opportunity[];
  staleCount: number;
  providerCount: number;
}

export class OpportunityDiscoveryPipeline {
  constructor(
    private readonly providers: OpportunityProviderRegistry,
    private readonly freshness: OpportunityFreshnessPolicy
  ) {}

  async discover(signal?: AbortSignal, nowMs = Date.now()): Promise<DiscoveryPipelineResult> {
    const discovered = await this.providers.discover(signal);
    const fresh = discovered.filter(opportunity => this.freshness.evaluate(opportunity, nowMs).fresh);
    return {
      opportunities: fresh,
      staleCount: discovered.length - fresh.length,
      providerCount: discovered.length
    };
  }
}
