import type { Opportunity, OpportunityDomain, OpportunityEvidence } from './opportunity-bus.js';

export interface RawOpportunity {
  id: string;
  venue: string;
  asset: string;
  value: number;
  cost: number;
  risk?: number;
  urgency?: number;
  liquidity?: number;
  requiredService?: string;
  signal: string;
  confidence: number;
  observedAt?: string;
}

export interface LiveOpportunityProvider {
  readonly name: string;
  discover(domain: OpportunityDomain, signal: AbortSignal): Promise<readonly RawOpportunity[]>;
}

export class LiveOpportunitySource {
  constructor(private readonly providers: readonly LiveOpportunityProvider[]) {}

  async discover(domain: OpportunityDomain, signal: AbortSignal): Promise<Opportunity[]> {
    const batches = await Promise.all(this.providers.map(provider => provider.discover(domain, signal)));
    const now = new Date().toISOString();
    return batches.flat().map(raw => this.normalize(domain, raw, now));
  }

  private normalize(domain: OpportunityDomain, raw: RawOpportunity, fallbackTime: string): Opportunity {
    const evidence: OpportunityEvidence = {
      source: raw.signal,
      observedAt: raw.observedAt ?? fallbackTime,
      confidence: Math.max(0, Math.min(1, raw.confidence)),
      signal: raw.signal
    };
    return {
      id: raw.id,
      domain,
      venue: raw.venue,
      asset: raw.asset,
      estimatedValue: Math.max(0, raw.value),
      estimatedCost: Math.max(0, raw.cost),
      risk: Math.max(0, Math.min(1, raw.risk ?? 0.5)),
      urgency: Math.max(0, Math.min(1, raw.urgency ?? 0.5)),
      liquidity: Math.max(0, Math.min(1, raw.liquidity ?? 0.5)),
      evidence: [evidence],
      requiredService: raw.requiredService
    };
  }
}
