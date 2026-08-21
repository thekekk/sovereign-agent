import type { CodingWorker, CodingWorkerResult } from './coding-worker.js';
import type { CheckpointManager, CheckpointRef } from './checkpoint.js';

export interface ResilientWorkerResult extends CodingWorkerResult {
  checkpoint: CheckpointRef | null;
  rolledBack: boolean;
}

/**
 * Adds a version-control safety boundary around a bounded coding iteration.
 * A failed/stopped mutation can return the workspace to its known-good state.
 */
export class ResilientCodingWorker {
  constructor(
    private readonly worker: CodingWorker,
    private readonly checkpoints: CheckpointManager
  ) {}

  async run(goal: string): Promise<ResilientWorkerResult> {
    const checkpoint = await this.checkpoints.create(`before task: ${goal}`);
    try {
      const result = await this.worker.run(goal);
      if (result.status === 'completed') {
        return { ...result, checkpoint, rolledBack: false };
      }
      await this.checkpoints.rollback(checkpoint);
      return { ...result, checkpoint, rolledBack: true };
    } catch (error) {
      await this.checkpoints.rollback(checkpoint);
      throw error;
    }
  }
}
