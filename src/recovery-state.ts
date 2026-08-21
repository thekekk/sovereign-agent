export type RecoveryPhase = 'idle' | 'mutating' | 'awaiting-verification' | 'rolling-back';

export interface RecoveryState {
  version: 1;
  phase: RecoveryPhase;
  taskId?: string;
  checkpointId?: string;
  startedAtMs?: number;
  evidenceBackend?: 'local' | 'github';
}

export interface RecoveryStore {
  load(): RecoveryState;
  save(state: RecoveryState): void;
  clear(): void;
}

/** Crash-safe state machine for an in-flight mutation. */
export class DurableRecoveryState {
  constructor(private readonly store: RecoveryStore) {}

  begin(taskId: string, checkpointId: string): RecoveryState {
    if (!taskId.trim() || !checkpointId.trim()) throw new Error('taskId and checkpointId are required');
    const state: RecoveryState = { version: 1, phase: 'mutating', taskId, checkpointId, startedAtMs: Date.now() };
    this.store.save(state);
    return state;
  }

  awaitingVerification(backend: 'local' | 'github'): RecoveryState {
    const current = this.requireActive();
    const next: RecoveryState = { ...current, phase: 'awaiting-verification', evidenceBackend: backend };
    this.store.save(next);
    return next;
  }

  rollingBack(): RecoveryState {
    const current = this.requireActive();
    const next: RecoveryState = { ...current, phase: 'rolling-back' };
    this.store.save(next);
    return next;
  }

  recover(): RecoveryState {
    return this.store.load();
  }

  complete(): void {
    this.store.clear();
  }

  private requireActive(): RecoveryState {
    const state = this.store.load();
    if (state.phase === 'idle') throw new Error('no active mutation');
    if (!state.checkpointId) throw new Error('active mutation has no checkpoint');
    return state;
  }
}
