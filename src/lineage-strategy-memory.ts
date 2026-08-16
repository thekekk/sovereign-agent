import type { LineageMemory } from './lineage-memory.js';
import type { StrategyLesson } from './strategy-memory.js';

export interface LineageDecisionContext {
  strategyId: string;
  context: string;
}

/** Read-only bridge: ancestral knowledge informs planning without bypassing survival policy. */
export class LineageStrategyMemory {
  constructor(private readonly lineage: LineageMemory) {}

  lessonsFor(decision: LineageDecisionContext): readonly StrategyLesson[] {
    return this.lineage.lessonsFor(decision.strategyId, decision.context).map(lesson => ({
      id: `${lesson.kind}:${lesson.strategyId}:${lesson.context}`,
      strategyId: lesson.strategyId,
      kind: lesson.kind,
      context: lesson.context,
      lesson: lesson.lesson,
      evidenceValue: lesson.evidenceValue,
      confidence: lesson.confidence,
      occurrences: lesson.occurrences
    }));
  }

  shouldAvoid(decision: LineageDecisionContext, threshold = 0.7): boolean {
    return this.lessonsFor(decision).some(lesson => lesson.kind === 'avoid' && lesson.confidence >= threshold);
  }

  reusable(decision: LineageDecisionContext, threshold = 0.5): readonly StrategyLesson[] {
    return this.lessonsFor(decision).filter(lesson => lesson.kind === 'use' && lesson.confidence >= threshold);
  }
}
