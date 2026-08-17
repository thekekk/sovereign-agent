import { describe, expect, it } from 'vitest';
import { AutonomousIterationController } from './autonomous-iteration-controller.js';

describe('recovery continuation boundary', () => {
  const decision = { action: 'recover', fitness: { score: -0.5, components: {} } as never, survival: { state: 'alive', priority: 'recover' } as never, reason: 'recover' } as never;
  const gate = { beforeMutation: async () => ({ allowed: true, reason: 'safe after recovery' }) };

  it('allows bounded continuation after successful recovery', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 2 });
    const first = await controller.authorize(decision);
    const second = await controller.authorize({ ...decision, action: 'continue' });
    const third = await controller.authorize({ ...decision, action: 'continue' });
    expect(first.completed).toBe(true);
    expect(second.completed).toBe(true);
    expect(third.stopped).toBe(true);
    expect(third.reason).toBe('iteration limit reached');
  });

  it('blocks every later mutation after recovery failure is latched', async () => {
    const controller = new AutonomousIterationController(gate, { maxIterations: 5 });
    controller.halt('recovery failed: rollback unavailable');
    const result = await controller.authorize({ ...decision, action: 'continue' });
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('recovery failed: rollback unavailable');
  });
});
