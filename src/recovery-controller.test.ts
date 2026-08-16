import { describe, expect, it } from 'vitest';
import { RecoveryController } from './recovery-controller.js';

describe('RecoveryController', () => {
  it('does not rollback when strategy says continue', async () => {
    const git = { rollback: async () => { throw new Error('must not call'); } } as never;
    const events: unknown[] = [];
    const ledger = { record: (event: unknown) => events.push(event) } as never;
    const controller = new RecoveryController(git, ledger);
    const result = await controller.execute({ action: 'continue' } as never, undefined, {} as never, 'task-1');
    expect(result.rolledBack).toBe(false);
    expect(events).toHaveLength(0);
  });
});
