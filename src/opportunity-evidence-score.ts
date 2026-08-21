import type { Opportunity } from './opportunity-bus.js';
import { scoreEvidence } from './evidence-quality.js';

export function evidenceAdjustedScore(opportunity: Opportunity, baseScore: number, now = Date.now()): number {
  const quality = scoreEvidence(opportunity, now);
  if (!opportunity.evidence.length) return 0;
  const confidenceMultiplier = 0.5 + quality.score * 0.5;
  return Math.max(0, baseScore) * confidenceMultiplier;
}
