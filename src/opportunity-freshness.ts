import type { Opportunity } from './opportunity-bus.js';

export interface FreshnessConfig {
  maxAgeMsByDomain: Partial<Record<Opportunity['domain'], number>>;
  defaultMaxAgeMs: number;
}

export interface FreshnessResult {
  fresh: boolean;
  ageMs: number;
  reason: string;
}

export class OpportunityFreshnessPolicy {
  constructor(private readonly config: FreshnessConfig) {}

  evaluate(opportunity: Opportunity, nowMs = Date.now()): FreshnessResult {
    const timestamps = opportunity.evidence.map(e => Date.parse(e.observedAt)).filter(Number.isFinite);
    if (!timestamps.length) return { fresh: false, ageMs: Number.POSITIVE_INFINITY, reason: 'no valid observation timestamp' };
    const latest = Math.max(...timestamps);
    const ageMs = Math.max(0, nowMs - latest);
    const maxAge = this.config.maxAgeMsByDomain[opportunity.domain] ?? this.config.defaultMaxAgeMs;
    return ageMs <= maxAge
      ? { fresh: true, ageMs, reason: 'opportunity evidence is fresh' }
      : { fresh: false, ageMs, reason: 'opportunity evidence is stale' };
  }
}
