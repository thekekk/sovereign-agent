import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';
import type { StrategyCandidate, StrategyExperience } from './strategy-learning.js';
import type { RecoveryRunner } from './recovery-runner.js';
import { AutonomyLearningLoop, type AutonomyLearningDecision } from './autonomy-learning-loop.js';
import type { AgentLearningContext, AgentExecutionContext } from './agent-learning-context.js';
import type { CodingMutationResult } from './verified-coding-mutation.js';

export interface UnifiedLearningResult {
  decision: AutonomyLearningDecision;
  mutation?: CodingMutationResult;
}

/** Closed-loop facade: policy first, verified work second, with mutation outcomes feeding lineage through AgentLearningContext. */
export class UnifiedLearningLoop {
  constructor(
    private readonly autonomy: AutonomyLearningLoop,
    private readonly execution: AgentLearningContext
  ) {}

  async decideAndExecute(
    summary: OutcomeSummary,
    snapshot: SurvivalSnapshot,
    candidates: readonly StrategyCandidate[],
    experience: readonly StrategyExperience[],
    context = '*',
    mutation?: { path: string; content: string; testCommand?: string }
  ): Promise<UnifiedLearningResult> {
    const decision = await this.autonomy.decide(summary, snapshot, candidates, experience, context);
    if (!decision.allowed || !mutation) return { decision };

    const result = await this.execution.execute(mutation.path, mutation.content, mutation.testCommand);
    return { decision, mutation: result };
  }
}
