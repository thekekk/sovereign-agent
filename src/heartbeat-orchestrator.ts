import type { AutonomyLoop } from './autonomy-loop.js';

export interface HeartbeatResult {
  status: 'blocked' | 'completed';
  reason: string;
}

export interface HeartbeatWork {
  run(): Promise<void>;
}

/** One bounded heartbeat: reconcile first, then permit at most one work unit. */
export class HeartbeatOrchestrator {
  constructor(
    private readonly autonomy: Pick<AutonomyLoop, 'beforeMutation'>,
    private readonly work: HeartbeatWork
  ) {}

  async tick(): Promise<HeartbeatResult> {
    const decision = await this.autonomy.beforeMutation();
    if (!decision.allowed) return { status: 'blocked', reason: decision.reason };
    await this.work.run();
    return { status: 'completed', reason: 'one bounded work unit completed' };
  }
}
