import { LineageManager, type AgentIdentity, type WorkerProposal } from './lineage.js';
import type { PopulationDecision } from './population.js';

export interface ChildAuthorization {
  authorized: boolean;
  child: AgentIdentity | null;
  reason: string;
}

/** Bridges verified population fitness to the existing lineage manager. */
export class LineagePopulationController {
  constructor(private readonly lineage = new LineageManager()) {}

  authorizeChild(
    parent: AgentIdentity,
    decision: PopulationDecision,
    proposal: WorkerProposal,
    availableBudget: number
  ): ChildAuthorization {
    if (decision.action !== 'replicate' || decision.childBudget <= 0) {
      return { authorized: false, child: null, reason: 'Population decision does not authorize replication' };
    }
    if (proposal.budget > decision.childBudget) {
      return { authorized: false, child: null, reason: 'Child proposal exceeds replication budget' };
    }
    const child = this.lineage.proposeChild(parent, proposal, Math.min(availableBudget, decision.childBudget));
    return child
      ? { authorized: true, child, reason: 'Child authorized by bounded population decision' }
      : { authorized: false, child: null, reason: 'Lineage manager rejected reproduction economics or generation limits' };
  }
}
