export type ChildLifecycleState = 'running' | 'survived' | 'terminated';

export interface ChildCiObservation {
  runId: string;
  workflow: string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'neutral';
  sourceCommit: string;
}

export interface ChildLifecycleResult {
  state: Exclude<ChildLifecycleState, 'running'>;
  survived: boolean;
  reason: string;
}

/** Finalizes an already-authorized child only from externally observed CI. */
export class ChildCiLifecycle {
  finalize(observation: ChildCiObservation, expectedSourceCommit: string): ChildLifecycleResult {
    if (!observation.runId.trim() || !observation.workflow.trim()) throw new Error('CI run identity is required');
    if (!/^[0-9a-f]{40}$/.test(observation.sourceCommit) || !/^[0-9a-f]{40}$/.test(expectedSourceCommit)) {
      throw new Error('source commits must be full SHA-1 identifiers');
    }
    if (observation.sourceCommit !== expectedSourceCommit) {
      return { state: 'terminated', survived: false, reason: 'CI provenance does not match child source commit' };
    }
    if (observation.conclusion !== 'success') {
      return { state: 'terminated', survived: false, reason: `CI conclusion was ${observation.conclusion}` };
    }
    return { state: 'survived', survived: true, reason: 'Child passed externally observed CI with matching source provenance' };
  }
}
