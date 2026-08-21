import type { Opportunity } from './opportunity-bus.js';
import type { ExecutionAuthorization } from './opportunity-execution-gate.js';

export interface OpportunityExecutionResult {
  opportunityId: string;
  domain: Opportunity['domain'];
  venue: string;
  authorization: ExecutionAuthorization;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  realizedValue?: number;
  realizedCost?: number;
  error?: string;
  provenance: {
    sourceEvidence: Opportunity['evidence'];
    walletId: string;
  };
}

export interface OpportunityExecutor {
  readonly domain: Opportunity['domain'];
  readonly service?: string;
  execute(opportunity: Opportunity, walletId: string, signal: AbortSignal): Promise<{ success: boolean; realizedValue?: number; realizedCost?: number; error?: string }>;
}
