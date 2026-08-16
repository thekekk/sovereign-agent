import type { LineageMemory } from './lineage-memory.js';
import type { StrategyLesson } from './strategy-memory.js';

export interface LineageDecisionContext {
  strategy: string;
  context: string;
}

/** Read-only bridge: ancestral knowledge informs planning without bypassing survival policy. */
export class LineageStrategyMemory {
  constructor(private readonly lineage: LineageMemory) {}

  lessonsFor(decision: LineageDecisionContext): readonly StrategyLesson[] {
    return this.lineage.lessonsFor(decision.strategy, decision.context);
  }

  shouldAvoid(decision: LineageDecisionContext, threshold = 0.7): boolean {
    return this.lessonsFor(decision).some(
      lesson => lesson.type === 'avoid' && lesson.confidence >= threshold
    );
  }

  reusable(decision: LineageDecisionContext, threshold = 0.5): readonly StrategyLesson[] {
    return this.lessonsFor(decision).filter(
      lesson => lesson.type === 'use' && lesson.confidence >= threshold
    );
  }
}
