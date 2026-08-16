import { CodingWorker } from './coding-worker.js';
import type { WorkerExecution, WorkerRunner } from './worker-loop.js';

/** Bridges one learned strategy to one bounded CodingWorker execution. */
export class CodingWorkerRunner implements WorkerRunner {
  constructor(
    private readonly worker: CodingWorker,
    private readonly taskIdFactory: () => string = () => `coding-${Date.now()}`
  ) {}

  async run(strategy: string): Promise<WorkerExecution> {
    const startedAt = Date.now();
    const result = await this.worker.run(strategy);
    const durationMs = Math.max(0, Date.now() - startedAt);
    const success = result.status === 'completed';
    return {
      strategy,
      taskId: this.taskIdFactory(),
      durationMs,
      cost: durationMs,
      value: success ? 1 : 0,
      success,
      lesson: result.history.at(-1) ?? `worker ${result.status}`
    };
  }
}
