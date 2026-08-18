import type { OpportunityDomain } from './opportunity-bus.js';
import { HttpOpportunityProvider, type HttpOpportunityProviderOptions } from './http-opportunity-provider.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export interface LiveProviderDefinition extends Omit<HttpOpportunityProviderOptions, 'domain'> {
  domain: OpportunityDomain;
}

export const createLiveProviderFeeds = (definitions: readonly LiveProviderDefinition[]): readonly LiveDomainFeed[] => {
  const feeds = new Map<OpportunityDomain, LiveDomainFeed>();
  for (const definition of definitions) {
    if (feeds.has(definition.domain)) throw new Error(`duplicate live feed domain: ${definition.domain}`);
    const provider = new HttpOpportunityProvider(definition);
    feeds.set(definition.domain, {
      domain: definition.domain,
      fetch: signal => provider.discover(definition.domain, signal)
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
