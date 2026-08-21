import type { OutcomeToLineage } from './outcome-to-lineage.js';
import type { VerifiedCodingMutation, CodingMutationResult } from './verified-coding-mutation.js';

export interface AgentExecutionContext {
  strategyId: string;
  context: string;
  originId: string;
}

/** Binds an agent execution identity to verified coding mutations so learning is automatic. */
export class AgentLearningContext {
  constructor(
    private readonly mutation: VerifiedCodingMutation,
    private readonly context: AgentExecutionContext
  ) {}

  execute(path: string, content: string, testCommand?: string): Promise<CodingMutationResult> {
    return this.mutation.execute(path, content, testCommand, this.context);
  }
}

export function createAgentLearningContext(
  mutation: VerifiedCodingMutation,
  context: AgentExecutionContext
): AgentLearningContext {
  return new AgentLearningContext(mutation, context);
}
