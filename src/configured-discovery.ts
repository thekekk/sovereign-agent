import { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { createConfiguredProviderRegistry } from './provider-runtime-factory.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';
import type { ProviderConfig } from './provider-config.js';

const DEFAULT_FRESHNESS = {
  maxAgeMsByDomain: {},
  defaultMaxAgeMs: 5 * 60 * 1000
};

export function createConfiguredDiscovery(
  configs: readonly ProviderConfig[],
  feeds: readonly LiveDomainFeed[],
  freshness = new OpportunityFreshnessPolicy(DEFAULT_FRESHNESS)
): OpportunityDiscoveryPipeline {
  const registry = createConfiguredProviderRegistry(configs, feeds);
  return new OpportunityDiscoveryPipeline(registry, freshness);
}
