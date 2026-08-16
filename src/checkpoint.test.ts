import { describe, expect, it } from 'vitest';
import { CheckpointManager, type VersionControl } from './checkpoint.js';

const commit = 'a'.repeat(40);

class FakeVcs implements VersionControl {
  clean = true;
  rolledBackTo: string | null = null;
  async status() { return { clean: this.clean }; }
  async checkpoint() { return commit; }
  async rollback(value: string) { this.rolledBackTo = value; }
}

describe('CheckpointManager', () => {
  it('creates a bounded checkpoint from a clean tree', async () => {
    const vcs = new FakeVcs();
    const manager = new CheckpointManager(vcs, { maxCheckpoints: 1 });
    const checkpoint = await manager.create('before autonomous edit');
    expect(checkpoint.commit).toBe(commit);
    expect(manager.list()).toHaveLength(1);
  });

  it('rejects dirty working trees', async () => {
    const vcs = new FakeVcs();
    vcs.clean = false;
    await expect(new CheckpointManager(vcs).create('checkpoint')).rejects.toThrow('clean working tree');
  });

  it('rolls back only to a manager-owned checkpoint', async () => {
    const vcs = new FakeVcs();
    const manager = new CheckpointManager(vcs);
    const checkpoint = await manager.create('known good');
    await manager.rollback(checkpoint);
    expect(vcs.rolledBackTo).toBe(commit);
    await expect(manager.rollback({ ...checkpoint, commit: 'b'.repeat(40) })).rejects.toThrow('not owned');
  });
});
