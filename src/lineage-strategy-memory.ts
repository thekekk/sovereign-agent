import { resolveLineageConflict } from './lineage-conflict-resolution.js';
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

  resolve(decision: LineageDecisionContext) {
    return resolveLineageConflict(this.lessonsFor(decision));
  }

  shouldAvoid(decision: LineageDecisionContext, threshold = 0.7): boolean {
    const resolved = this.resolve(decision);
    return resolved.winner === 'avoid' && Math.abs(resolved.score) > 0 && resolved.avoid.some(lesson => lesson.confidence >= threshold);
  }

  reusable(decision: LineageDecisionContext, threshold = 0.5): readonly StrategyLesson[] {
    const resolved = this.resolve(decision);
    return resolved.winner === 'use'
      ? resolved.use.filter(lesson => lesson.confidence >= threshold)
      : [];
  }
}
