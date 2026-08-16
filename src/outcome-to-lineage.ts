import type { StrategyLessonKind } from './strategy-memory.js';
import type { LineageMemory, LineageLesson } from './lineage-memory.js';
import type { CodingMutationResult } from './verified-coding-mutation.js';

export interface OutcomeLessonInput {
  strategyId: string;
  context: string;
  outcome: CodingMutationResult;
  originId: string;
}

/** Turns verified coding outcomes into durable USE/AVOID lessons for descendants. */
export class OutcomeToLineage {
  constructor(private readonly lineage: LineageMemory) {}

  record(input: OutcomeLessonInput): LineageLesson {
    const kind: StrategyLessonKind = input.outcome.evidence.verified ? 'use' : 'avoid';
    const confidence = input.outcome.evidence.verified ? 0.7 : 0.8;
    const generation = this.lineage.snapshot().generation;
    const lesson: LineageLesson = {
      id: `${kind}:${input.strategyId}:${input.context}`,
      strategyId: input.strategyId,
      kind,
      context: input.context,
      lesson: input.outcome.evidence.reason,
      evidenceValue: input.outcome.evidence.value,
      confidence,
      occurrences: 1,
      originId: input.originId,
      generation
    };
    this.lineage.add(lesson);
    return lesson;
  }
}
