import { describe, expect, it } from 'vitest';
import { OpportunityDecisionEngine } from './opportunity-decision-engine.js';
import type { Opportunity, WalletCapability } from './opportunity-bus.js';

const wallet: WalletCapability = { walletId: 'w1', domains: ['crypto', 'pokemon'], services: ['dex', 'marketplace'], canExecute: true };
const make = (id: string, domain: Opportunity['domain'], value: number, confidence = 0.9): Opportunity => ({
  id, domain, venue: 'venue', asset: id, estimatedValue: value, estimatedCost: 10,
  risk: 0.2, urgency: 0.7, liquidity: 0.8,
  evidence: [{ source: 'source', observedAt: new Date().toISOString(), confidence, signal: 'signal' }]
});

describe('opportunity decision engine', () => {
  it('selects the best executable opportunity from different domains', () => {
    const engine = new OpportunityDecisionEngine();
    const ranked = engine.rank([make('small', 'crypto', 20), make('large', 'pokemon', 100)], wallet);
    expect(ranked[0].opportunity.id).toBe('large');
    expect(engine.best(ranked.map(item => item.opportunity), wallet)?.opportunity.id).toBe('large');
  });

  it('never executes an incompatible or uneconomic opportunity', () => {
    const engine = new OpportunityDecisionEngine();
    const result = engine.rank([make('wrong-domain', 'xstocks', 100), make('loss', 'crypto', 5)], wallet);
    expect(result.every(item => item.action === 'skip')).toBe(true);
  });

  it('watches weak evidence instead of treating hype as authorization', () => {
    const engine = new OpportunityDecisionEngine();
    const result = engine.rank([make('hype', 'crypto', 100, 0.1)], wallet);
    expect(result[0].action).toBe('watch');
  });
});
