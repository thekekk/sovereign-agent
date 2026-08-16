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
    const autonomy = { decide: vi.fn().mockResolvedValue({ action: 'stop', selectedStrategy: null, confidence: 0, fitness: 0, survival: 0, reason: 'rollback required', allowed: false }) };
    const loop = new UnifiedLearningLoop(autonomy as never, { execute } as never);

    const result = await loop.decideAndExecute(summary, snapshot, [], [], 'build', { path: 'x.ts', content: 'x' });
    expect(result.decision.allowed).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it('executes allowed work and returns its verified outcome', async () => {
    const execute = vi.fn().mockResolvedValue(mutationResult(true));
    const autonomy = { decide: vi.fn().mockResolvedValue({ action: 'continue', selectedStrategy: 'A', confidence: 1, fitness: 1, survival: 1, reason: 'ok', allowed: true }) };
    const loop = new UnifiedLearningLoop(autonomy as never, { execute } as never);

    const result = await loop.decideAndExecute(summary, snapshot, [], [], 'build', { path: 'build', content: 'A' });
    expect(result.decision.allowed).toBe(true);
    expect(result.mutation?.evidence.verified).toBe(true);
    expect(execute).toHaveBeenCalledWith('build', 'A', undefined);
  });
});
