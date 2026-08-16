import type { HeartbeatOrchestrator } from './heartbeat-orchestrator.js';

export interface OrganismCycleResult {
  status: 'blocked' | 'completed' | 'failed';
  reason: string;
}

/** Top-level composition boundary: exactly one bounded heartbeat per invocation. */
export class OrganismCycle {
  constructor(private readonly heartbeat: Pick<HeartbeatOrchestrator, 'tick'>) {}

  async run(): Promise<OrganismCycleResult> {
    try {
      const result = await this.heartbeat.tick();
      return { status: result.status, reason: result.reason };
    } catch (error) {
      return {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown organism-cycle failure'
      };
    }
  }
}
