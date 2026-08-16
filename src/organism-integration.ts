import type { HeartbeatWork } from './heartbeat-orchestrator.js';
import type { WorkerLoop, WorkerLoopResult } from './worker-loop.js';
import type { StrategyCandidate, StrategyExperience } from './strategy-learning.js';
import type { SurvivalSnapshot } from './survival.js';

export interface WorkerCycleInput {
  summary: Parameters<WorkerLoop['run']>[0];
  snapshot: SurvivalSnapshot;
  candidates: readonly StrategyCandidate[];
  experience: readonly StrategyExperience[];
  runner: Parameters<WorkerLoop['run']>[4];
}

/** Adapter that makes exactly one WorkerLoop iteration a heartbeat work unit. */
export class OrganismWorkerWork implements HeartbeatWork {
  public lastResult: WorkerLoopResult | null = null;

  constructor(
    private readonly workerLoop: WorkerLoop,
    private readonly input: WorkerCycleInput
  ) {}

  async run(): Promise<void> {
    this.lastResult = await this.workerLoop.run(
      this.input.summary,
      this.input.snapshot,
      this.input.candidates,
      this.input.experience,
      this.input.runner
    );
  }
}
