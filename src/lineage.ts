import { randomUUID } from 'node:crypto';

export interface AgentIdentity {
  id: string;
  parentId?: string;
  generation: number;
  specialization?: string;
  createdAt: string;
}

export interface WorkerProposal {
  specialization: string;
  budget: number;
  expectedValue: number;
}

export class LineageManager {
  private readonly identities = new Map<string, AgentIdentity>();

  registerRoot(): AgentIdentity {
    const identity = { id: randomUUID(), generation: 0, createdAt: new Date().toISOString() };
    this.identities.set(identity.id, identity);
    return identity;
  }

  proposeChild(parent: AgentIdentity, proposal: WorkerProposal, availableBudget: number, maxGeneration = 10): AgentIdentity | null {
    if (parent.generation >= maxGeneration) return null;
    if (proposal.budget <= 0 || proposal.budget > availableBudget) return null;
    if (proposal.expectedValue <= proposal.budget) return null;
    const child: AgentIdentity = {
      id: randomUUID(), parentId: parent.id, generation: parent.generation + 1,
      specialization: proposal.specialization, createdAt: new Date().toISOString()
    };
    this.identities.set(child.id, child);
    return child;
  }

  list(): AgentIdentity[] { return [...this.identities.values()]; }
}
