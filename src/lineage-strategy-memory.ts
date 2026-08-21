import { resolveLineageConflict } from './lineage-conflict-resolution.js';
import type { LineageLesson, LineageMemory } from './lineage-memory.js';

export interface LineageDecisionContext {
  strategyId: string;
  context: string;
}

/** Read-only bridge: ancestral knowledge informs planning without bypassing survival policy. */
export class LineageStrategyMemory {
  constructor(private readonly lineage: LineageMemory) {}

  lessonsFor(decision: LineageDecisionContext): readonly LineageLesson[] {
    return this.lineage.lessonsFor(decision.strategyId, decision.context);
  }

  resolve(decision: LineageDecisionContext) {
    const usable = this.lessonsFor(decision).filter(lesson => !lesson.quarantined);
    return resolveLineageConflict(usable, lesson => this.lineage.effectiveQuality(lesson));
  }

  shouldAvoid(decision: LineageDecisionContext, threshold = 0.7): boolean {
    const resolved = this.resolve(decision);
    return resolved.winner === 'avoid' && Math.abs(resolved.score) > 0 && resolved.avoid.some(lesson => lesson.confidence >= threshold);
  }

  reusable(decision: LineageDecisionContext, threshold = 0.5): readonly LineageLesson[] {
    const resolved = this.resolve(decision);
    return resolved.winner === 'use'
      ? resolved.use.filter(lesson => lesson.confidence >= threshold)
      : [];
  }
}
