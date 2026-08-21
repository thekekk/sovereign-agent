export type PopulationAction = 'survive' | 'replicate' | 'terminate';

export interface PopulationState {
  id: string;
  balance: number;
  fitness: number;
  generation: number;
  maxChildren: number;
  childrenCreated: number;
}

export interface PopulationDecision {
  action: PopulationAction;
  reason: string;
  childBudget: number;
}

/**
 * Conway-inspired lineage controller. Replication is earned by verified
 * positive economics and is always bounded by an explicit child budget.
 */
export class PopulationController {
  decide(state: PopulationState): PopulationDecision {
    if (!Number.isFinite(state.balance) || !Number.isFinite(state.fitness)) {
      throw new Error('balance and fitness must be finite');
    }
    if (state.balance <= 0) {
      return { action: 'terminate', reason: 'No operating balance remains', childBudget: 0 };
    }
    if (state.childrenCreated >= state.maxChildren) {
      return { action: 'survive', reason: 'Replication budget exhausted', childBudget: 0 };
    }
    if (state.fitness > 0 && state.balance > 0) {
      const remaining = Math.max(0, state.maxChildren - state.childrenCreated);
      return { action: 'replicate', reason: 'Positive fitness with remaining replication budget', childBudget: Math.min(1, remaining) };
    }
    return { action: 'survive', reason: 'Insufficient verified fitness for replication', childBudget: 0 };
  }
}
