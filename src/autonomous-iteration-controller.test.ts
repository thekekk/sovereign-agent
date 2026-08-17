import { describe, expect, it } from 'vitest';
import { AutonomousIterationController } from './autonomous-iteration-controller.js';
import type { StrategyDecision } from './strategy-controller.js';

const decision = (action: StrategyDecision['action']): StrategyDecision => ({
  action,
  fitness: { score: 0, components: {} } as never,
  survival: { state: 'alive', priority: 'continue', reason: 'ok' } as never,
  reason: 'test'
});

describe('AutonomousIterationController', () => {
  it('stops before mutation when recovery is unresolved', async () => {
    let calls = 0;
    const controller = new AutonomousIterationController({
      beforeMutation: async () => { calls += 1; return { allowed: false, reason: 'recovery required' }; }
    }, { maxIterations: 3 });
    const result = await controller.authorize(decision('continue'));
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('recovery required');
    expect(controller.count).toBe(0);
    expect(calls).toBe(1);
  });

  it('enforces the hard iteration limit', async () => {
    const controller = new AutonomousIterationController({
      beforeMutation: async () => ({ allowed: true, reason: 'safe' })
    }, { maxIterations: 2 });
    expect((await controller.authorize(decision('continue'))).completed).toBe(true);
    expect((await controller.authorize(decision('continue'))).completed).toBe(true);
    const third = await controller.authorize(decision('continue'));
    expect(third.stopped).toBe(true);
    expect(third.reason).toBe('iteration limit reached');
    expect(controller.count).toBe(2);
  });

  it('never lets a strategy stop get overridden by the gate', async () => {
    let called = false;
    const controller = new AutonomousIterationController({
      beforeMutation: async () => { called = true; return { allowed: true, reason: 'safe' }; }
    }, { maxIterations: 3 });
    const result = await controller.authorize(decision('stop'));
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('strategy stop is authoritative');
    expect(called).toBe(false);
  });
});
