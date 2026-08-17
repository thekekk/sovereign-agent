import { describe, expect, it } from 'vitest';
import { OpportunityOutcomeLearning } from './opportunity-outcome-learning.js';

const opportunity = { id: 'x', domain: 'crypto' as const, venue: 'dex', asset: 'x', estimatedValue: 100, estimatedCost: 10, risk: 0.2, urgency: 0.5, liquidity: 0.8, evidence: [] };

describe('opportunity outcome learning', () => {
  it('aggregates realized outcomes without granting execution authority', () => {
    const learning = new OpportunityOutcomeLearning();
    learning.record(opportunity, { success: true, realizedValue: 120 });
    const lesson = learning.record(opportunity, { success: false, error: 'reverted' });
    expect(lesson.attempts).toBe(2);
    expect(lesson.successes).toBe(1);
    expect(lesson.realizedValue).toBe(120);
    expect(lesson.confidence).toBe(0.5);
  });
});
