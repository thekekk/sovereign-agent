import type { AgentIdentity } from './lineage.js';
import type { PopulationAction } from './population.js';

export type ChildStatus = 'authorized' | 'running' | 'survived' | 'terminated';

export interface ChildLifecycle {
  child: AgentIdentity;
  status: ChildStatus;
  budget: number;
  parentId: string;
  sourceCommit: string;
  runId?: string;
}

/** State machine for one bounded offspring; it cannot self-authorize reproduction. */
export class ChildLifecycleController {
  authorize(child: AgentIdentity, parentId: string, budget: number, sourceCommit: string): ChildLifecycle {
    if (!parentId || budget <= 0 || !/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error('invalid child authorization');
    return { child, status: 'authorized', budget, parentId, sourceCommit };
  }

  start(state: ChildLifecycle): ChildLifecycle {
    if (state.status !== 'authorized') throw new Error('child is not authorized to start');
    return { ...state, status: 'running' };
  }

  settle(state: ChildLifecycle, action: PopulationAction, runId?: string): ChildLifecycle {
    if (state.status !== 'running') throw new Error('child is not running');
    if (action === 'survive' || action === 'replicate') {
      if (!runId) throw new Error('surviving child requires verified run ID');
      return { ...state, status: 'survived', runId };
    }
    return { ...state, status: 'terminated', runId };
  }
}
