import type { Opportunity } from './opportunity-bus.js';

export class OpportunityDeduplicator {
  merge(opportunities: readonly Opportunity[]): Opportunity[] {
    const byKey = new Map<string, Opportunity>();
    for (const opportunity of opportunities) {
      const key = `${opportunity.domain}:${opportunity.venue}:${opportunity.asset}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, opportunity);
        continue;
      }
      const evidence = [...existing.evidence, ...opportunity.evidence];
      const preferred = opportunity.evidence.reduce((best, item) => item.confidence > best.confidence ? item : best, evidence[0]);
      byKey.set(key, {
        ...existing,
        estimatedValue: Math.max(existing.estimatedValue, opportunity.estimatedValue),
        estimatedCost: Math.min(existing.estimatedCost, opportunity.estimatedCost),
        risk: Math.min(existing.risk, opportunity.risk),
        urgency: Math.max(existing.urgency, opportunity.urgency),
        liquidity: Math.max(existing.liquidity, opportunity.liquidity),
        evidence,
        requiredService: existing.requiredService ?? opportunity.requiredService,
        id: preferred.signal ? existing.id : opportunity.id
      });
    }
    return [...byKey.values()];
  }
}
