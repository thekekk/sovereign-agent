import type { OpportunityDomain } from './opportunity-bus.js';
import type { RawOpportunity } from './live-opportunity-source.js';

export interface HttpOpportunityProviderOptions {
  name: string;
  domain: OpportunityDomain;
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  map?: (payload: unknown) => readonly RawOpportunity[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const defaultMap = (payload: unknown): readonly RawOpportunity[] => {
  const rows = Array.isArray(payload) ? payload : isRecord(payload) && Array.isArray(payload.opportunities) ? payload.opportunities : [];
  return rows.filter(isRecord).map((row, index) => ({
    id: String(row.id ?? `${row.venue ?? 'unknown'}:${row.asset ?? index}`),
    venue: String(row.venue ?? 'unknown'),
    asset: String(row.asset ?? 'unknown'),
    value: Number(row.value ?? row.estimatedValue ?? 0),
    cost: Number(row.cost ?? row.estimatedCost ?? 0),
    risk: Number(row.risk ?? 0.5),
    urgency: Number(row.urgency ?? 0.5),
    liquidity: Number(row.liquidity ?? 0.5),
    requiredService: typeof row.requiredService === 'string' ? row.requiredService : undefined,
    signal: String(row.signal ?? 'http'),
    confidence: Number(row.confidence ?? 0.5),
    observedAt: typeof row.observedAt === 'string' ? row.observedAt : undefined
  }));
};

export class HttpOpportunityProvider {
  readonly name: string;
  private readonly options: HttpOpportunityProviderOptions;

  constructor(options: HttpOpportunityProviderOptions) {
    this.options = options;
    this.name = options.name;
    if (!/^https?:$/.test(new URL(options.url).protocol)) throw new Error('provider URL must use http or https');
  }

  async discover(domain: OpportunityDomain, signal: AbortSignal): Promise<readonly RawOpportunity[]> {
    if (domain !== this.options.domain) throw new Error(`provider domain mismatch: ${domain}`);
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('provider timeout')), this.options.timeoutMs ?? 10_000);
    try {
      const response = await fetch(this.options.url, { headers: this.options.headers, signal: controller.signal });
      if (!response.ok) throw new Error(`provider ${this.name} returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      return (this.options.map ?? defaultMap)(payload);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  }
}
