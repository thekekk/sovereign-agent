import { describe, expect, it } from 'vitest';
import { AutonomousIterationController } from './autonomous-iteration-controller.js';
import type { StrategyDecision } from './strategy-controller.js';

const decision = {
  action: 'recover',
  fitness: { score: -0.5, components: {} },
  survival: { state: 'alive', priority: 'recover' },
  reason: 'recover'
} as unknown as StrategyDecision;

const continuation = (): StrategyDecision => ({
  ...decision,
  action: 'continue'
});

const gate = { beforeMutation: async () => ({ allowed: true, reason: 'safe after recovery' }) };

describe('recovery continuation boundary', () => {
  it('allows bounded continuation after successful recovery', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 2 });
    const first = await controller.authorize(decision);
    const second = await controller.authorize(continuation());
    const third = await controller.authorize(continuation());
    expect(first.completed).toBe(true);
    expect(second.completed).toBe(true);
    expect(third.stopped).toBe(true);
    expect(third.reason).toBe('iteration limit reached');
  });

  it('blocks every later mutation after recovery failure is latched', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 5 });
    controller.halt('recovery failed: rollback unavailable');
    const result = await controller.authorize(continuation());
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('recovery failed: rollback unavailable');
  });
});
