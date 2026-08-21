import type { WorkerRunner } from './worker-loop.js';
import type { WorkerExecution } from './worker-loop.js';
import type { WorkerVerifier, WorkerVerification } from './verified-worker-runner.js';

/** Local verification: completion is observable locally, but never claims GitHub provenance. */
export class LocalWorkerVerifier implements WorkerVerifier {
  async verify(execution: WorkerExecution): Promise<WorkerVerification> {
    const verified = execution.success;
    return {
      verified,
      value: verified ? execution.value : 0,
      reason: verified ? 'Local worker completed successfully; no remote provenance asserted' : 'Local worker did not complete successfully'
    };
  }
}

export interface RuntimeMode {
  kind: 'local' | 'github';
  workerVerifier: WorkerVerifier;
}

export function createLocalRuntime(): RuntimeMode {
  return { kind: 'local', workerVerifier: new LocalWorkerVerifier() };
}

export function isGitHubRuntimeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.GITHUB_TOKEN?.trim() && env.GITHUB_REPOSITORY?.trim());
}
