import { HttpOpportunityFeed } from './http-opportunity-feed.js';

export interface CryptoFeedConfig {
  url: string;
  timeoutMs?: number;
  token?: string;
}

export function createCryptoFeed(config: CryptoFeedConfig): HttpOpportunityFeed {
  return new HttpOpportunityFeed({
    domain: 'crypto',
    url: config.url,
    timeoutMs: config.timeoutMs ?? 10_000,
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined
  });
}
