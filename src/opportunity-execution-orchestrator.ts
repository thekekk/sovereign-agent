import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import type { OpportunityOutcomeLearning } from './opportunity-outcome-learning.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import { OpportunityExecutorRegistry } from './opportunity-executor-registry.js';
import type { OpportunityExecutionResult } from './opportunity-execution-result.js';

export class OpportunityExecutionOrchestrator {
  constructor(
    private readonly gate: OpportunityExecutionGate,
    private readonly executors: OpportunityExecutorRegistry,
    private readonly learning: OpportunityOutcomeLearning
  ) {}

  async execute(opportunity: Opportunity, wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<OpportunityExecutionResult> {
    const startedAt = new Date().toISOString();
    const authorization = this.gate.authorize({ opportunity, wallet });
    if (authorization.decision !== 'execute') {
      const result = { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization, startedAt, finishedAt: new Date().toISOString(), success: false, provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
      return result;
    }
    const executor = this.executors.resolve(opportunity, wallet);
    if (!executor) {
      const result = { opportunityId: opportunity.id, domain: opportunity.domain, venue: opportunity.venue, authorization: { ...authorization, decision: 'skip' as const, reason: 'no compatible executor' }, startedAt, finishedAt: new Date().toISOString(), success: false, error: 'no compatible executor', provenance: { sourceEvidence: opportunity.evidence, walletId: wallet.walletId } };
      return result;
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
