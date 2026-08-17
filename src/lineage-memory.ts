import type { StrategyLesson } from './strategy-memory.js';

export interface LineageLesson extends StrategyLesson {
  originId: string;
  generation: number;
  inheritedFrom?: string;
  quarantined?: boolean;
  contradictionCount?: number;
}

export interface LineageSnapshot {
  generation: number;
  lessons: readonly LineageLesson[];
}

export class LineageMemory {
  private readonly lessons = new Map<string, LineageLesson>();

  constructor(private readonly generation: number) {}

  inherit(parent: LineageSnapshot): void {
    for (const lesson of parent.lessons) {
      const key = this.key(lesson);
      const inherited = { ...lesson, inheritedFrom: lesson.originId };
      const existing = this.lessons.get(key);
      if (!existing || this.quality(inherited) > this.quality(existing)) this.lessons.set(key, inherited);
    }
  }

  add(lesson: LineageLesson): void {
    const key = this.key(lesson);
    const existing = this.lessons.get(key);
    if (!existing) {
      this.lessons.set(key, { ...lesson });
    } else if (existing.originId !== lesson.originId) {
      const combined: LineageLesson = {
        ...existing,
        evidenceValue: existing.evidenceValue + lesson.evidenceValue,
        occurrences: existing.occurrences + Math.max(1, lesson.occurrences),
        confidence: Math.min(0.95, existing.confidence + lesson.confidence * (1 - existing.confidence) * 0.25),
        generation: Math.min(existing.generation, lesson.generation)
      };
      if (this.quality(combined) >= this.quality(existing)) this.lessons.set(key, combined);
    } else {
      return;
    }

    // USE and AVOID live under separate keys. Record a contradiction on the
    // opposite lesson so repeated independent counter-evidence can quarantine it.
    const oppositeKey = this.key({ ...lesson, kind: lesson.kind === 'use' ? 'avoid' : 'use' });
    const opposite = this.lessons.get(oppositeKey);
    if (opposite && opposite.originId !== lesson.originId) {
      const count = (opposite.contradictionCount ?? 0) + 1;
      this.lessons.set(oppositeKey, { ...opposite, contradictionCount: count, quarantined: count >= 2 });
    }
  }

  snapshot(): LineageSnapshot { return { generation: this.generation, lessons: [...this.lessons.values()] }; }

  lessonsFor(strategyId: string, context: string): LineageLesson[] {
    return [...this.lessons.values()].filter(l => l.strategyId === strategyId && (l.context === context || l.context === '*'));
  }

  effectiveQuality(lesson: LineageLesson): number {
    const age = Math.max(0, this.generation - lesson.generation);
    return this.baseQuality(lesson) * Math.pow(0.9, age);
  }

  private key(lesson: Pick<LineageLesson, 'strategyId' | 'kind' | 'context' | 'lesson'>): string {
    return `${lesson.strategyId}:${lesson.kind}:${lesson.context}:${lesson.lesson}`;
  }

  private quality(lesson: LineageLesson): number { return this.effectiveQuality(lesson); }
  private baseQuality(lesson: LineageLesson): number {
    return lesson.confidence * Math.max(1, lesson.occurrences) * Math.max(1, Math.abs(lesson.evidenceValue));
  }
}
