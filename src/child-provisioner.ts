import type { AgentIdentity } from './lineage.js';

export interface ChildProvisionRequest {
  parent: AgentIdentity;
  branch: string;
  parentCommit: string;
}

export interface ChildProvisionResult {
  branch: string;
  parentId: string;
  generation: number;
  maxIterations: number;
  maxChildren: number;
}

/**
 * Pure provisioning contract. The GitHub adapter is intentionally injected so
 * policy can decide whether an authorized child may create a remote branch.
 */
export interface BranchCreator {
  create(branch: string, parentCommit: string): Promise<void>;
}

export class ChildProvisioner {
  constructor(private readonly branches: BranchCreator) {}

  async provision(request: ChildProvisionRequest): Promise<ChildProvisionResult> {
    if (!request.parent.id || !request.parent.parentId && request.parent.generation > 0) {
      throw new Error('invalid child lineage identity');
    }
    if (!/^[0-9a-f]{40}$/.test(request.parentCommit)) throw new Error('parent commit must be a full SHA-1');
    if (request.parent.parentCommit && request.parent.parentCommit !== request.parentCommit) {
      throw new Error('parent commit does not match lineage provenance');
    }
    const budget = request.parent.resourceBudget;
    if (!budget || budget.maxIterations <= 0 || budget.maxChildren <= 0) {
      throw new Error('child has no valid resource budget');
    }
    if (!/^lineage\/child-gen-\d+-[a-z0-9-]+$/.test(request.branch)) {
      throw new Error('invalid child branch name');
    }

    await this.branches.create(request.branch, request.parentCommit);
    return {
      branch: request.branch,
      parentId: request.parent.id,
      generation: request.parent.generation,
      maxIterations: budget.maxIterations,
      maxChildren: budget.maxChildren
    };
  }
}
