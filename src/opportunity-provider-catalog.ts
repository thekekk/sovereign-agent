import type { OpportunityDomain } from './opportunity-bus.js';
import type { OpportunityProviderConfig } from './opportunity-provider-config.js';

export const DEFAULT_PROVIDER_CATALOG: readonly OpportunityProviderConfig[] = [
  { id: 'crypto', domain: 'crypto', enabled: true, pollIntervalMs: 30_000, timeoutMs: 10_000, maxAgeMs: 60_000 },
  { id: 'xstocks', domain: 'xstocks', enabled: true, pollIntervalMs: 60_000, timeoutMs: 10_000, maxAgeMs: 120_000 },
  { id: 'social-hype', domain: 'social-hype', enabled: true, pollIntervalMs: 15_000, timeoutMs: 8_000, maxAgeMs: 30_000 },
  { id: 'mint', domain: 'mint', enabled: true, pollIntervalMs: 15_000, timeoutMs: 8_000, maxAgeMs: 30_000 },
  { id: 'goods', domain: 'goods', enabled: true, pollIntervalMs: 60_000, timeoutMs: 10_000, maxAgeMs: 180_000 },
  { id: 'collectibles', domain: 'collectibles', enabled: true, pollIntervalMs: 60_000, timeoutMs: 10_000, maxAgeMs: 180_000 },
  { id: 'pokemon', domain: 'pokemon', enabled: true, pollIntervalMs: 60_000, timeoutMs: 10_000, maxAgeMs: 180_000 },
  { id: 'online-service', domain: 'online-service', enabled: true, pollIntervalMs: 120_000, timeoutMs: 15_000, maxAgeMs: 300_000 },
  { id: 'other', domain: 'other', enabled: true, pollIntervalMs: 120_000, timeoutMs: 15_000, maxAgeMs: 300_000 }
];

export const domainsFromCatalog = (catalog: readonly OpportunityProviderConfig[]): readonly OpportunityDomain[] =>
  [...new Set(catalog.filter(item => item.enabled).map(item => item.domain))];
