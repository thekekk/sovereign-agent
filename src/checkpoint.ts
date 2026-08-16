export interface CheckpointRef {
  id: string;
  commit: string;
  createdAt: string;
  reason: string;
}

export interface VersionControl {
  status(): Promise<{ clean: boolean }>;
  checkpoint(message: string): Promise<string>;
  rollback(commit: string): Promise<void>;
}

export interface CheckpointPolicy {
  maxCheckpoints: number;
}

/**
 * Safe version-control boundary for autonomous work. The worker can create
 * checkpoints and roll back to a known commit, but the VCS implementation is
 * injected and remains outside the model's direct authority.
 */
export class CheckpointManager {
  private readonly checkpoints: CheckpointRef[] = [];

  constructor(
    private readonly vcs: VersionControl,
    private readonly policy: CheckpointPolicy = { maxCheckpoints: 20 }
  ) {
    if (!Number.isInteger(policy.maxCheckpoints) || policy.maxCheckpoints < 1) {
      throw new Error('maxCheckpoints must be a positive integer');
    }
  }

  async create(reason: string): Promise<CheckpointRef> {
    if (!reason.trim()) throw new Error('checkpoint reason is required');
    const state = await this.vcs.status();
    if (!state.clean) throw new Error('checkpoint requires a clean working tree');

    const commit = await this.vcs.checkpoint(`sovereign: ${reason.trim()}`);
    if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('VCS returned an invalid commit identifier');

    const checkpoint: CheckpointRef = {
      id: `checkpoint-${commit.slice(0, 12)}`,
      commit,
      createdAt: new Date().toISOString(),
      reason: reason.trim()
    };
    this.checkpoints.push(checkpoint);
    while (this.checkpoints.length > this.policy.maxCheckpoints) this.checkpoints.shift();
    return checkpoint;
  }

  async rollback(checkpoint: CheckpointRef): Promise<void> {
    if (!this.checkpoints.some(item => item.id === checkpoint.id && item.commit === checkpoint.commit)) {
      throw new Error('checkpoint is not owned by this manager');
    }
    if (!/^[0-9a-f]{40}$/.test(checkpoint.commit)) throw new Error('invalid checkpoint commit');
    await this.vcs.rollback(checkpoint.commit);
  }

  list(): readonly CheckpointRef[] {
    return [...this.checkpoints];
  }
}
