import type { OpportunityDomain } from './opportunity-bus.js';
import { HttpOpportunityFeed } from './http-opportunity-feed.js';

const domains: OpportunityDomain[] = ['crypto', 'xstocks', 'social-hype', 'mint', 'goods', 'collectibles', 'pokemon', 'online-service', 'other'];

export function createConfiguredDomainFeeds(env: NodeJS.ProcessEnv = process.env) {
  return domains.flatMap(domain => {
    const key = domain.toUpperCase().replace(/-/g, '_');
    const url = env[`AGENT_${key}_FEED_URL`];
    if (!url) return [];
    return [new HttpOpportunityFeed({
      domain,
      url,
      timeoutMs: Number(env[`AGENT_${key}_FEED_TIMEOUT_MS`] ?? 10_000),
      headers: env[`AGENT_${key}_FEED_TOKEN`] ? { Authorization: `Bearer ${env[`AGENT_${key}_FEED_TOKEN`]}` } : undefined
    })];
  });
}
