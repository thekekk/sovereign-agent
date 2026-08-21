import { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { createConfiguredProviderRegistry } from './provider-runtime-factory.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';
import type { ProviderConfig } from './provider-config.js';

export function createConfiguredDiscovery(
  configs: readonly ProviderConfig[],
  feeds: readonly LiveDomainFeed[],
  freshness = new OpportunityFreshnessPolicy()
): OpportunityDiscoveryPipeline {
  const registry = createConfiguredProviderRegistry(configs, feeds);
  return new OpportunityDiscoveryPipeline(registry, freshness);
}
