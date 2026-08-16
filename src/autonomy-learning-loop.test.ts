import { describe, expect, it, vi } from 'vitest';
import { AutonomyLearningLoop } from './autonomy-learning-loop.js';
import type { StrategyLearning } from './strategy-learning.js';

const baseArgs = [
  { attempts: 0, successfulAttempts: 0, verifiedValue: 0, totalCost: 0 } as never,
  { runway: 100, survivalScore: 1 } as never,
  [{ name: 'good', basePriority: 1, estimatedCost: 1 }],
  []
] as const;

describe('AutonomyLearningLoop', () => {
  it('stops before learning when recovery is unsafe', async () => {
    const learning = { decide: vi.fn() } as unknown as StrategyLearning;
    const recovery = { reconcile: vi.fn().mockResolvedValue({ safeToContinue: false, reason: 'rollback pending' }) };
    const loop = new AutonomyLearningLoop(recovery, learning);

    const result = await loop.decide(...baseArgs);

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('stop');
    expect(result.selectedStrategy).toBeNull();
    expect(learning.decide).not.toHaveBeenCalled();
  });

  it('allows learned selection after recovery succeeds', async () => {
    const learning = { decide: vi.fn().mockReturnValue({ action: 'continue', reason: 'strategy selected', selectedStrategy: 'good', confidence: 0.9 }) } as unknown as StrategyLearning;
    const recovery = { reconcile: vi.fn().mockResolvedValue({ safeToContinue: true, reason: 'recovered' }) };
    const loop = new AutonomyLearningLoop(recovery, learning);

    const result = await loop.decide(...baseArgs);

    expect(result.allowed).toBe(true);
    expect(result.selectedStrategy).toBe('good');
    expect(learning.decide).toHaveBeenCalledOnce();
  });

  it('never converts a learning stop decision into permission', async () => {
    const learning = { decide: vi.fn().mockReturnValue({ action: 'stop', reason: 'insufficient runway', selectedStrategy: null, confidence: 0 }) } as unknown as StrategyLearning;
    const recovery = { reconcile: vi.fn().mockResolvedValue({ safeToContinue: true, reason: 'recovered' }) };
    const loop = new AutonomyLearningLoop(recovery, learning);

    const result = await loop.decide(...baseArgs);

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('stop');
    expect(result.selectedStrategy).toBeNull();
  });
});
