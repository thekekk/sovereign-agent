import { describe, expect, it } from 'vitest';
import { GitCheckpointController } from './git-checkpoint.js';

describe('GitCheckpointController', () => {
  it('rejects an invalid checkpoint commit before executing git', async () => {
    const executor = { execute: async () => ({ code: 0, stdout: '', stderr: '' }) } as never;
    const controller = new GitCheckpointController(executor);
    await expect(controller.rollback({ commit: 'not-a-commit', label: 'x', createdAt: new Date().toISOString() }, {} as never))
      .rejects.toThrow('Invalid checkpoint commit');
  });
});
