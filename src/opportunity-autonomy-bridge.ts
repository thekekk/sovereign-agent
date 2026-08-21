import type { Opportunity, WalletCapability } from './opportunity-bus.js';
import { OpportunityDecisionEngine, type RankedOpportunity } from './opportunity-decision-engine.js';
import { OpportunityExecutionGate, type ExecutionAuthorization } from './opportunity-execution-gate.js';
import type { AutonomousIterationController } from './autonomous-iteration-controller.js';

export interface OpportunityAutonomyResult {
  ranked?: RankedOpportunity;
  authorization?: ExecutionAuthorization;
  allowed: boolean;
  reason: string;
}

export class OpportunityAutonomyBridge {
  constructor(
    private readonly decisions: OpportunityDecisionEngine,
    private readonly execution: OpportunityExecutionGate,
    private readonly controller: AutonomousIterationController
  ) {}

  async authorizeBest(opportunities: readonly Opportunity[], wallet: WalletCapability): Promise<OpportunityAutonomyResult> {
    const ranked = this.decisions.best(opportunities, wallet);
    if (!ranked) return { allowed: false, reason: 'no executable opportunity passed decision policy' };

    const authorization = this.execution.authorize({ opportunity: ranked.opportunity, wallet });
    if (authorization.decision !== 'execute') return { ranked, authorization, allowed: false, reason: authorization.reason };

    const strategyDecision = {
      action: 'continue',
      fitness: { score: ranked.score, components: {} },
      survival: { state: 'alive', priority: 'continue' },
      reason: `execute opportunity ${ranked.opportunity.id}`
    } as never;
    const result = await this.controller.authorize(strategyDecision);
    if (result.stopped) return { ranked, authorization, allowed: false, reason: result.reason ?? 'autonomy controller stopped execution' };
    return { ranked, authorization, allowed: true, reason: 'opportunity passed decision, execution and autonomy gates' };
  }
}
