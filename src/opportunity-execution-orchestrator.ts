import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import type { OpportunityOutcomeLearning } from './opportunity-outcome-learning.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import { OpportunityExecutorRegistry } from './opportunity-executor-registry.js';
import type { OpportunityExecutionResult } from './opportunity-execution-result.js';
import { ExecutionSafetyGate } from './execution-safety-gate.js';

export class OpportunityExecutionOrchestrator {
  constructor(
    private readonly gate: OpportunityExecutionGate,
    private readonly executors: OpportunityExecutorRegistry,
    private readonly learning: OpportunityOutcomeLearning,
    private readonly safetyGate?: ExecutionSafetyGate
  ) {}

  async execute(opportunity: Opportunity, wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<OpportunityExecutionResult> {
    const startedAt = new Date().toISOString();
    if (this.safetyGate) {
      const safety = this.safetyGate.authorize(opportunity, wallet);
      if (!safety.allowed) {
        return { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization: { decision: 'skip', reason: safety.reason, opportunityId: opportunity.id }, startedAt, finishedAt: new Date().toISOString(), success: false, error: safety.reason, provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
      }
    }
    const authorization = this.gate.authorize({ opportunity, wallet });
    if (authorization.decision !== 'execute') {
      return { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization, startedAt, finishedAt: new Date().toISOString(), success: false, provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
    }
    const executor = this.executors.resolve(opportunity, wallet);
    if (!executor) {
      return { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization: { ...authorization, decision: 'skip' as const, reason: 'no compatible executor' }, startedAt, finishedAt: new Date().toISOString(), success: false, error: 'no compatible executor', provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
    }
    try {
      const execution = await executor.execute(opportunity, wallet.walletId, signal);
      this.learning.record(opportunity, { success: execution.success, realizedValue: execution.realizedValue, error: execution.error });
      return { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization, startedAt, finishedAt: new Date().toISOString(), ...execution, provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.learning.record(opportunity, { success: false, error: message });
      return { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization, startedAt, finishedAt: new Date().toISOString(), success: false, error: message, provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
    }
  }
}
