import { describe, expect, it, vi } from 'vitest';
import { ResilientCodingWorker } from './resilient-coding-worker.js';

describe('ResilientCodingWorker', () => {
  it('keeps a successful run at the checkpoint', async () => {
    const checkpoint = { id: 'checkpoint-123456789012', commit: '1'.repeat(40), createdAt: new Date().toISOString(), reason: 'before task: improve' };
    const checkpoints = { create: vi.fn().mockResolvedValue(checkpoint), rollback: vi.fn() };
    const worker = { run: vi.fn().mockResolvedValue({ status: 'completed', iterations: 1, history: ['ok'] }) };
    const result = await new ResilientCodingWorker(worker as never, checkpoints as never).run('improve');
    expect(result.rolledBack).toBe(false);
    expect(checkpoints.rollback).not.toHaveBeenCalled();
  });

  it('rolls back a failed bounded run', async () => {
    const checkpoint = { id: 'checkpoint-123456789012', commit: '2'.repeat(40), createdAt: new Date().toISOString(), reason: 'before task: fix' };
    const checkpoints = { create: vi.fn().mockResolvedValue(checkpoint), rollback: vi.fn().mockResolvedValue(undefined) };
    const worker = { run: vi.fn().mockResolvedValue({ status: 'failed', iterations: 2, history: ['test failed'] }) };
    const result = await new ResilientCodingWorker(worker as never, checkpoints as never).run('fix');
    expect(result.rolledBack).toBe(true);
    expect(checkpoints.rollback).toHaveBeenCalledWith(checkpoint);
  });

  it('rolls back if the worker throws', async () => {
    const checkpoint = { id: 'checkpoint-123456789012', commit: '3'.repeat(40), createdAt: new Date().toISOString(), reason: 'before task: recover' };
    const checkpoints = { create: vi.fn().mockResolvedValue(checkpoint), rollback: vi.fn().mockResolvedValue(undefined) };
    const worker = { run: vi.fn().mockRejectedValue(new Error('worker failure')) };
    await expect(new ResilientCodingWorker(worker as never, checkpoints as never).run('recover')).rejects.toThrow('worker failure');
    expect(checkpoints.rollback).toHaveBeenCalledWith(checkpoint);
  });
});
