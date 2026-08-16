import type { RecoveryRunner } from './recovery-runner.js';

export interface AutonomyDecision {
  allowed: boolean;
  reason: string;
}

/** Startup/heartbeat guard: unresolved recovery always wins over new mutation. */
export class AutonomyLoop {
  constructor(private readonly recovery: Pick<RecoveryRunner, 'reconcile'>) {}

  async beforeMutation(): Promise<AutonomyDecision> {
    const recovery = await this.recovery.reconcile();
    if (!recovery.safeToContinue) {
      return { allowed: false, reason: `recovery required: ${recovery.reason}` };
    }
    return { allowed: true, reason: recovery.reason };
  }
}
