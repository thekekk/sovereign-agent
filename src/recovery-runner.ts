import type { CheckpointManager } from './checkpoint.js';
import type { DurableRecoveryState } from './recovery-state.js';

export interface RecoveryAction {
  taskId: string;
  action: 'resume-verification' | 'rollback' | 'none';
  checkpointId?: string;
  safeToContinue: boolean;
  reason: string;
}

/** Crash-recovery boundary: never starts new mutation while an old one is unresolved. */
export class RecoveryRunner {
  constructor(
    private readonly state: DurableRecoveryState,
    private readonly checkpoints: Pick<CheckpointManager, 'rollbackById'>
  ) {}

  async reconcile(): Promise<RecoveryAction> {
    const pending = this.state.recover();
    if (pending.phase === 'idle') {
      return { taskId: '', action: 'none', safeToContinue: true, reason: 'no active mutation' };
    }

    if (!pending.taskId || !pending.checkpointId) {
      return { taskId: pending.taskId ?? '', action: 'rollback', safeToContinue: false, reason: 'active recovery state is incomplete' };
    }

    if (pending.phase === 'awaiting-verification') {
      return {
        taskId: pending.taskId,
        action: 'resume-verification',
        checkpointId: pending.checkpointId,
        safeToContinue: false,
        reason: 'verification is still pending'
      };
    }

    if (pending.phase === 'mutating' || pending.phase === 'rolling-back') {
      await this.checkpoints.rollbackById(pending.checkpointId);
      this.state.complete();
      return {
        taskId: pending.taskId,
        action: 'rollback',
        checkpointId: pending.checkpointId,
        safeToContinue: true,
        reason: 'interrupted mutation rolled back to known-good checkpoint'
      };
    }

    return { taskId: pending.taskId, action: 'none', safeToContinue: false, reason: 'unknown recovery phase' };
  }
}
