import type { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { registerLiveFeeds } from './live-provider-registry.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export interface LiveDiscoveryRuntime {
  providers: OpportunityProviderRegistry;
  discovery: OpportunityDiscoveryPipeline;
}

export function createLiveDiscoveryRuntime(
  providers: OpportunityProviderRegistry,
  feeds: readonly LiveDomainFeed[],
  freshness: OpportunityFreshnessPolicy
): LiveDiscoveryRuntime {
  registerLiveFeeds(providers, feeds);
  return { providers, discovery: new OpportunityDiscoveryPipeline(providers, freshness) };
}
