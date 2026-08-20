import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import { DomainPolicyGate } from './domain-policy-gate.js';

export interface OpportunityRuntimeResult {
  discovered: number;
  stale: number;
  eligible: number;
  rejected: number;
  selectedId?: string;
  execution?: Awaited<ReturnType<OpportunityExecutionOrchestrator['execute']>>;
}

export class OpportunityRuntime {
  constructor(
    private readonly discovery: OpportunityDiscoveryPipeline,
    private readonly decision: OpportunityDecisionPolicy,
    private readonly execution: OpportunityExecutionOrchestrator,
    private readonly gate: OpportunityDecisionGate,
    private readonly domainPolicy: DomainPolicyGate
  ) {}

  async run(wallet: WalletCapability, signal?: AbortSignal): Promise<OpportunityRuntimeResult> {
    const found = await this.discovery.discover(signal);
    const candidates = found.opportunities;
    const eligibleCandidates = candidates.filter(opportunity =>
      this.domainPolicy.evaluate(opportunity).allowed && this.gate.evaluate(opportunity, wallet).allowed
    );
    const selected = this.decision.best(eligibleCandidates, wallet);
    if (!selected) return {
      discovered: candidates.length,
      stale: found.staleCount,
      eligible: eligibleCandidates.length,
      rejected: candidates.length - eligibleCandidates.length
    };
    const execution = await this.execution.execute(selected.opportunity, wallet, signal);
    return {
      discovered: candidates.length,
      stale: found.staleCount,
      eligible: eligibleCandidates.length,
      rejected: candidates.length - eligibleCandidates.length,
      selectedId: selected.opportunity.id,
      execution
    };
  }
}

export const asOpportunity = (value: Opportunity): Opportunity => value;
