import { describe, expect, it } from 'vitest';
import { ChildLifecycleController } from './child-lifecycle.js';

describe('ChildLifecycleController', () => {
  const controller = new ChildLifecycleController();
  const child = { id: 'child-1', generation: 1, createdAt: new Date().toISOString() };
  const commit = 'a'.repeat(40);

  it('requires authorization before start', () => {
    const state = controller.authorize(child, 'parent-1', 1, commit);
    expect(controller.start(state).status).toBe('running');
  });

  it('requires verified run evidence for survival', () => {
    const state = controller.start(controller.authorize(child, 'parent-1', 1, commit));
    expect(() => controller.settle(state, 'survive')).toThrow('verified run ID');
  });

  it('terminates a failed child', () => {
    const state = controller.start(controller.authorize(child, 'parent-1', 1, commit));
    expect(controller.settle(state, 'terminate').status).toBe('terminated');
  });
});
