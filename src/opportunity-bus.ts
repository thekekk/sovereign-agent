export type OpportunityDomain = 'crypto' | 'xstocks' | 'online-service' | 'social-hype' | 'mint' | 'goods' | 'collectibles' | 'pokemon' | 'other';

export interface WalletCapability {
  walletId: string;
  domains: readonly OpportunityDomain[];
  services: readonly string[];
  canExecute: boolean;
}

export interface OpportunityEvidence {
  source: string;
  observedAt: string;
  confidence: number;
  signal: string;
}

export interface Opportunity {
  id: string;
  domain: OpportunityDomain;
  venue: string;
  asset: string;
  estimatedValue: number;
  estimatedCost: number;
  risk: number;
  urgency: number;
  liquidity: number;
  evidence: readonly OpportunityEvidence[];
  requiredService?: string;
  requiredCapability?: string;
}

export interface OpportunityAdapter {
  readonly domain: OpportunityDomain;
  discover(signal: AbortSignal): Promise<readonly Opportunity[]>;
}

export interface OpportunityBusOptions {
  maxPerAdapter?: number;
}

export class OpportunityBus {
  private readonly adapters = new Map<string, OpportunityAdapter>();

  constructor(private readonly options: OpportunityBusOptions = {}) {}

  register(adapter: OpportunityAdapter): void {
    this.adapters.set(`${adapter.domain}:${this.adapters.size}`, adapter);
  }

  async discover(signal?: AbortSignal): Promise<Opportunity[]> {
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const results = await Promise.all([...this.adapters.values()].map(async adapter => {
        const items = await adapter.discover(controller.signal);
        return this.options.maxPerAdapter ? items.slice(0, this.options.maxPerAdapter) : [...items];
      }));
      return results.flat();
    } finally {
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
