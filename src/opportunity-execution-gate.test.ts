import { describe, expect, it } from 'vitest';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import type { Opportunity } from './opportunity-bus.js';

const opportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'demo', domain: 'crypto', venue: 'demo', asset: 'demo', estimatedValue: 100, estimatedCost: 10,
  risk: 0.2, urgency: 0.8, liquidity: 0.9,
  evidence: [{ source: 'test', observedAt: new Date().toISOString(), confidence: 0.9, signal: 'confirmed' }],
  ...overrides
});
const wallet = { walletId: 'w1', domains: ['crypto'] as const, services: ['demo'], canExecute: true };

describe('opportunity execution gate', () => {
  it('executes only when all hard gates pass', () => {
    expect(new OpportunityExecutionGate().authorize({ opportunity: opportunity(), wallet }).decision).toBe('execute');
  });
  it('never lets unsupported services execute', () => {
    expect(new OpportunityExecutionGate().authorize({ opportunity: opportunity({ requiredService: 'unknown' }), wallet }).decision).toBe('skip');
  });
  it('watches weak evidence instead of executing', () => {
    expect(new OpportunityExecutionGate().authorize({ opportunity: opportunity({ evidence: [{ source: 'x', observedAt: new Date().toISOString(), confidence: 0.2, signal: 'hype' }] }), wallet }).decision).toBe('watch');
  });
  it('rejects uneconomic or extreme-risk opportunities', () => {
    const gate = new OpportunityExecutionGate();
    expect(gate.authorize({ opportunity: opportunity({ estimatedValue: 5 }), wallet }).decision).toBe('skip');
    expect(gate.authorize({ opportunity: opportunity({ risk: 0.95 }), wallet }).decision).toBe('skip');
  });
});
