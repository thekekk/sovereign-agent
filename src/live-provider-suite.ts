import type { OpportunityDomain } from './opportunity-bus.js';
import { HttpOpportunityProvider, type HttpOpportunityProviderOptions } from './http-opportunity-provider.js';
import type { LiveDomainFeed, RawOpportunitySignal } from './live-opportunity-adapter.js';

export interface LiveProviderDefinition extends Omit<HttpOpportunityProviderOptions, 'domain'> {
  id: string;
  domain: OpportunityDomain;
}

export const createLiveProviderFeeds = (definitions: readonly LiveProviderDefinition[]): readonly LiveDomainFeed[] => {
  const feeds = new Map<OpportunityDomain, LiveDomainFeed>();
  for (const definition of definitions) {
    if (feeds.has(definition.domain)) throw new Error(`duplicate live feed domain: ${definition.domain}`);
    const provider = new HttpOpportunityProvider({ ...definition, name: definition.name || definition.id });
    feeds.set(definition.domain, {
      domain: definition.domain,
      fetch: async signal => {
        const opportunities = await provider.discover(definition.domain, signal);
        return opportunities.map((item): RawOpportunitySignal => ({
          id: item.id,
          venue: item.venue,
          asset: item.asset,
          estimatedValue: item.value,
          estimatedCost: item.cost,
          risk: item.risk ?? 0.5,
          urgency: item.urgency ?? 0.5,
          liquidity: item.liquidity ?? 0.5,
          source: provider.name,
          signal: item.signal,
          confidence: item.confidence,
          observedAt: item.observedAt,
          requiredService: item.requiredService
        }));
      }
    });
  }
  return [...feeds.values()];
};

export const liveProviderDefinitionsFromEnv = (
  env: Record<string, string | undefined> = process.env
): readonly LiveProviderDefinition[] => {
  const domains: OpportunityDomain[] = ['crypto', 'xstocks', 'social-hype', 'mint', 'goods', 'collectibles', 'pokemon', 'online-service'];
  return domains.flatMap(domain => {
    const key = `SOVEREIGN_${domain.toUpperCase().replace('-', '_')}_URL`;
    const url = env[key];
    return url ? [{ id: `http-${domain}`, name: `http-${domain}`, domain, url }] : [];
  });
};
