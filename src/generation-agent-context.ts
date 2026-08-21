import type { CodingMutationLearningContext } from './verified-coding-mutation.js';
import type { ChildLineage } from './lineage-reproduction.js';

export interface GenerationAgentContext {
  generation: number;
  originId: string;
  strategyId: string;
  context: string;
}

/** Stable identity passed from generation lifecycle into verified coding work. */
export function toCodingLearningContext(agent: GenerationAgentContext): CodingMutationLearningContext {
  if (!agent.originId.trim()) throw new Error('originId is required');
  if (!agent.strategyId.trim()) throw new Error('strategyId is required');
  if (!agent.context.trim()) throw new Error('context is required');
  if (!Number.isInteger(agent.generation) || agent.generation < 1) throw new Error('generation must be a positive integer');
  return { strategyId: agent.strategyId, context: agent.context, originId: agent.originId };
}

export function contextForChild(child: ChildLineage, strategyId: string, context: string): GenerationAgentContext {
  return { generation: child.generation, originId: child.parentOriginId, strategyId, context };
}
