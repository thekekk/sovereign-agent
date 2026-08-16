export type StrategyLessonKind = 'use' | 'avoid';

export interface StrategyLesson {
  id: string;
  strategyId: string;
  kind: StrategyLessonKind;
  context: string;
  lesson: string;
  evidenceValue: number;
  confidence: number;
  occurrences: number;
}

export interface LessonQuery {
  strategyId?: string;
  context?: string;
  kind?: StrategyLessonKind;
}

/** Durable-shaped lesson store: successful patterns are reusable; harmful patterns are explicitly avoidable. */
export class StrategyMemory {
  private readonly lessons = new Map<string, StrategyLesson>();

  record(input: Omit<StrategyLesson, 'id' | 'occurrences'>): StrategyLesson {
    const id = `${input.kind}:${input.strategyId}:${input.context}`;
    const previous = this.lessons.get(id);
    const occurrences = (previous?.occurrences ?? 0) + 1;
    const confidence = Math.min(1, Math.max(previous?.confidence ?? 0, input.confidence) + 0.05);
    const lesson = { ...input, id, occurrences, confidence };
    this.lessons.set(id, lesson);
    return lesson;
  }

  recall(query: LessonQuery = {}): StrategyLesson[] {
    return [...this.lessons.values()]
      .filter(item => !query.strategyId || item.strategyId === query.strategyId)
      .filter(item => !query.context || item.context === query.context)
      .filter(item => !query.kind || item.kind === query.kind)
      .sort((a, b) => b.confidence * b.occurrences - a.confidence * a.occurrences);
  }

  shouldAvoid(strategyId: string, context?: string): boolean {
    return this.recall({ strategyId, context, kind: 'avoid' }).some(item => item.confidence >= 0.7);
  }

  reusable(strategyId: string, context?: string): StrategyLesson[] {
    return this.recall({ strategyId, context, kind: 'use' }).filter(item => item.confidence >= 0.5);
  }
}
