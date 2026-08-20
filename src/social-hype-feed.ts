import { HttpOpportunityFeed } from './http-opportunity-feed.js';

export interface SocialHypeFeedConfig {
  url: string;
  timeoutMs?: number;
  token?: string;
}

export function createSocialHypeFeed(config: SocialHypeFeedConfig): HttpOpportunityFeed {
  return new HttpOpportunityFeed({
    domain: 'social-hype',
    url: config.url,
    timeoutMs: config.timeoutMs ?? 10_000,
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined
  });
}
