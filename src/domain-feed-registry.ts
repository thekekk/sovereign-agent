import type { OpportunityDomain } from './opportunity-bus.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export class DomainFeedRegistry {
  private readonly feeds = new Map<OpportunityDomain, LiveDomainFeed>();

  register(feed: LiveDomainFeed): void {
    if (this.feeds.has(feed.domain)) throw new Error(`domain feed already registered: ${feed.domain}`);
    this.feeds.set(feed.domain, feed);
  }

  get(domain: OpportunityDomain): LiveDomainFeed | undefined { return this.feeds.get(domain); }
  domains(): readonly OpportunityDomain[] { return [...this.feeds.keys()]; }
}
