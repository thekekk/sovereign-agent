import { describe, expect, it, vi } from 'vitest';
import { UnifiedLearningLoop } from './unified-learning-loop.js';

const snapshot = { runway: 100, survivalScore: 1 } as never;
const summary = { attempts: 0, successfulAttempts: 0, verifiedValue: 0, totalCost: 0 } as never;

function mutationResult(verified: boolean) {
  return {
    checkpointId: 'cp-1',
    evidence: { backend: 'local', verified, value: verified ? 10 : 0, reason: verified ? 'verified' : 'tests failed' }
  };
}

describe('UnifiedLearningLoop', () => {
  it('does not execute mutation when recovery is unsafe', async () => {
    const execute = vi.fn();
    const recovery = { reconcile: vi.fn().mockResolvedValue({ safeToContinue: false, reason: 'rollback required' }) };
    const learning = { decide: vi.fn().mockReturnValue({ action: 'continue', selectedStrategy: 'A', confidence: 1, fitness: 1, survival: 1, reason: 'ok' }) };
    const loop = new UnifiedLearningLoop(recovery as never, learning as never, { execute } as never);

    const result = await loop.run(summary, snapshot, [], [], 'build', 'A', 'child-1');
    expect(result.allowed).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(learning.decide).not.toHaveBeenCalled();
  });

  it('executes allowed work and returns its verified outcome', async () => {
    const execute = vi.fn().mockResolvedValue(mutationResult(true));
    const recovery = { reconcile: vi.fn().mockResolvedValue({ safeToContinue: true, reason: 'ok' }) };
    const learning = { decide: vi.fn().mockReturnValue({ action: 'continue', selectedStrategy: 'A', confidence: 1, fitness: 1, survival: 1, reason: 'ok' }) };
    const loop = new UnifiedLearningLoop(recovery as never, learning as never, { execute } as never);

    const result = await loop.run(summary, snapshot, [], [], 'build', 'A', 'child-1');
    expect(result.allowed).toBe(true);
    expect(result.outcome?.evidence.verified).toBe(true);
    expect(execute).toHaveBeenCalledWith('build', 'A', 'child-1');
  });
});
