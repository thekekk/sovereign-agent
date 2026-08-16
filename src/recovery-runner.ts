import type { CheckpointManager } from './checkpoint.js';
import type { RecoveryStateStore, RecoveryRecord } from './recovery-state.js';

export interface RecoveryAction {
  taskId: string;
  action: 'resume-verification' | 'rollback' | 'none';
  checkpointId?: string;
}

/** Crash-recovery boundary: never starts new mutation while an old one is unresolved. */
export class RecoveryRunner {
  constructor(
    private readonly state: RecoveryStateStore,
    private readonly checkpoints: Pick<CheckpointManager, 'rollback'>
  ) {}

  async reconcile(): Promise<RecoveryAction> {
    const pending = await this.state.getActive();
    if (!pending) return { taskId: '', action: 'none' };

    if (pending.phase === 'awaiting-verification') {
      return { taskId: pending.taskId, action: 'resume-verification', checkpointId: pending.checkpointId };
    }

    if (pending.phase === 'mutating' || pending.phase === 'rolling-back') {
      await this.checkpoints.rollback(pending.checkpointId);
      await this.state.complete(pending.taskId, 'recovered-by-rollback');
      return { taskId: pending.taskId, action: 'rollback', checkpointId: pending.checkpointId };
    }

    return { taskId: pending.taskId, action: 'none', checkpointId: pending.checkpointId };
  }
}
