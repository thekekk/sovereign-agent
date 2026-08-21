import type { Opportunity } from './opportunity-bus.js';

export interface EvidenceQuality {
  score: number;
  independentSources: number;
  fresh: boolean;
}

export function scoreEvidence(opportunity: Opportunity, now = Date.now()): EvidenceQuality {
  const sources = new Set(opportunity.evidence.map(item => item.source));
  const timestamps = opportunity.evidence.map(item => Date.parse(item.observedAt)).filter(Number.isFinite);
  const freshest = timestamps.length ? Math.max(...timestamps) : 0;
  const fresh = freshest > 0 && now - freshest <= 15 * 60_000;
  const confidence = opportunity.evidence.length
    ? opportunity.evidence.reduce((sum, item) => sum + item.confidence, 0) / opportunity.evidence.length
    : 0;
  const independence = Math.min(1, sources.size / 3);
  const score = Math.min(1, confidence * 0.5 + independence * 0.3 + (fresh ? 0.2 : 0));
  return { score, independentSources: sources.size, fresh };
}
