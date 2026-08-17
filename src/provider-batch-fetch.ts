import type { Opportunity } from './opportunity-bus.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export interface FeedBatchResult {
  opportunities: readonly Opportunity[];
  failures: readonly { domain: LiveDomainFeed['domain']; error: string }[];
}

export async function fetchDomainFeeds(
  feeds: readonly LiveDomainFeed[],
  adapter: (feed: LiveDomainFeed, signal: AbortSignal) => Promise<readonly Opportunity[]>,
  signal: AbortSignal
): Promise<FeedBatchResult> {
  const settled = await Promise.allSettled(feeds.map(feed => adapter(feed, signal)));
  const opportunities: Opportunity[] = [];
  const failures: { domain: LiveDomainFeed['domain']; error: string }[] = [];
  settled.forEach((result, index) => {
    const feed = feeds[index];
    if (result.status === 'fulfilled') opportunities.push(...result.value);
    else failures.push({ domain: feed.domain, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
  });
  return { opportunities, failures };
}
