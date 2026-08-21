import type { WorkerExecution } from './worker-loop.js';
import type { WorkerVerification, WorkerVerifier } from './verified-worker-runner.js';
import { GitHubChildCiObserver } from './github-child-ci-observer.js';

export interface WorkerRunEvidence {
  runId: number;
  expectedSourceCommit: string;
  valueOnSuccess: number;
}

/** Concrete verifier: worker value is earned only by a completed, provenance-matching CI run. */
export class GitHubWorkerVerifier implements WorkerVerifier {
  constructor(private readonly observer: GitHubChildCiObserver) {}

  async verify(execution: WorkerExecution): Promise<WorkerVerification> {
    const raw = execution.lesson.match(/runId=(\d+)\s+commit=([0-9a-f]{40})/);
    if (!raw) {
      return { verified: false, value: 0, reason: 'Missing GitHub verification evidence in worker result' };
    }
    const observation = await this.observer.observe(Number(raw[1]), raw[2]);
    return {
      verified: observation.verified,
      value: observation.verified ? execution.value : 0,
      reason: observation.reason
    };
  }
}
