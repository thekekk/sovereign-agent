import type { WorkerExecution, WorkerRunner } from './worker-loop.js';

export interface WorkerVerification {
  verified: boolean;
  reason: string;
  value: number;
}

export interface WorkerVerifier {
  verify(execution: WorkerExecution): Promise<WorkerVerification>;
}

/** Prevents local worker completion from being mistaken for economic success. */
export class VerifiedWorkerRunner implements WorkerRunner {
  constructor(
    private readonly inner: WorkerRunner,
    private readonly verifier: WorkerVerifier
  ) {}

  async run(strategy: string): Promise<WorkerExecution> {
    const execution = await this.inner.run(strategy);
    const verification = await this.verifier.verify(execution);
    return {
      ...execution,
      success: verification.verified,
      value: verification.verified ? verification.value : 0,
      lesson: `${execution.lesson}; verification=${verification.verified ? 'passed' : 'failed'}: ${verification.reason}`
    };
  }
}
