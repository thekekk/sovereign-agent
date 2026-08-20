import type { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import type { OpportunityDiscoveryPipeline } from './opportunity-discovery-pipeline.js';
import type { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import type { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import type { WalletCapability } from './opportunity-bus.js';

export interface DryRunResult {
  discovered: number;
  stale: number;
  rejected: number;
  eligible: number;
  selectedId?: string;
  executed: false;
}

export async function runLiveDryRun(
  discovery: OpportunityDiscoveryPipeline,
  gate: OpportunityDecisionGate,
  decision: OpportunityDecisionPolicy,
  _execution: OpportunityExecutionOrchestrator,
  wallet: WalletCapability,
  signal?: AbortSignal
): Promise<DryRunResult> {
  const found = await discovery.discover(signal);
  const candidates = found.opportunities;
  const eligible = candidates.filter(item => gate.evaluate(item, wallet).allowed);
  const selected = decision.best(eligible, wallet);
  return {
    discovered: candidates.length,
    stale: found.staleCount,
    rejected: candidates.length - eligible.length,
    eligible: eligible.length,
    selectedId: selected?.opportunity.id,
    executed: false
  };
}
