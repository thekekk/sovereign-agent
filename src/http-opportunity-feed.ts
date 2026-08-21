import type { OpportunityDomain } from './opportunity-bus.js';
import type { LiveDomainFeed, RawOpportunitySignal } from './live-opportunity-adapter.js';

export interface HttpOpportunityFeedOptions {
  domain: OpportunityDomain;
  url: string;
  timeoutMs: number;
  headers?: Record<string, string>;
}

export class HttpOpportunityFeed implements LiveDomainFeed {
  readonly domain: OpportunityDomain;
  constructor(private readonly options: HttpOpportunityFeedOptions) {
    this.domain = options.domain;
    if (!options.url) throw new Error('feed url is required');
    if (options.timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  }

  async fetch(signal: AbortSignal): Promise<readonly RawOpportunitySignal[]> {
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('feed timeout')), this.options.timeoutMs);
    try {
      const response = await globalThis.fetch(this.options.url, {
        headers: this.options.headers,
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`feed returned HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (!Array.isArray(body)) throw new Error('feed response must be an array');
      return body.filter((item): item is RawOpportunitySignal => this.isSignal(item));
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  }

  private isSignal(value: unknown): value is RawOpportunitySignal {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string' && typeof item.venue === 'string' &&
      typeof item.asset === 'string' && typeof item.estimatedValue === 'number' &&
      typeof item.estimatedCost === 'number' && typeof item.risk === 'number' &&
      typeof item.urgency === 'number' && typeof item.liquidity === 'number' &&
      typeof item.source === 'string' && typeof item.signal === 'string' &&
      typeof item.confidence === 'number';
  }
}
