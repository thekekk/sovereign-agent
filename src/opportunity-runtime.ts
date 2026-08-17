import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';

export interface OpportunityRuntimeResult {
  discovered: number;
  stale: number;
  eligible: number;
  selectedId?: string;
  execution?: Awaited<ReturnType<OpportunityExecutionOrchestrator['execute']>>;
}

export class OpportunityRuntime {
  constructor(
    private readonly discovery: OpportunityDiscoveryPipeline,
    private readonly decision: OpportunityDecisionPolicy,
    private readonly execution: OpportunityExecutionOrchestrator
  ) {}

  async run(wallet: WalletCapability, signal?: AbortSignal): Promise<OpportunityRuntimeResult> {
    const found = await this.discovery.discover(signal);
    const candidates = found.opportunities;
    const selected = this.decision.best(candidates, wallet);
    if (!selected) return { discovered: candidates.length, stale: found.staleCount, eligible: 0 };
    const execution = await this.execution.execute(selected.opportunity, wallet, signal);
    return {
      discovered: candidates.length,
      stale: found.staleCount,
      eligible: 1,
      selectedId: selected.opportunity.id,
      execution
    };
  }
}

export const asOpportunity = (value: Opportunity): Opportunity => value;
