import type { StrategyLesson } from './strategy-memory.js';

export interface LineageLesson extends StrategyLesson {
  originId: string;
  generation: number;
  inheritedFrom?: string;
}

export interface LineageSnapshot {
  generation: number;
  lessons: readonly LineageLesson[];
}

/** Knowledge inheritance only: transient runtime state is deliberately excluded. */
export class LineageMemory {
  private readonly lessons = new Map<string, LineageLesson>();

  constructor(private readonly generation: number) {}

  inherit(parent: LineageSnapshot): void {
    for (const lesson of parent.lessons) {
      const key = `${lesson.strategyId}:${lesson.kind}:${lesson.context}:${lesson.lesson}`;
      const inherited = { ...lesson, generation: this.generation, inheritedFrom: lesson.originId };
      const existing = this.lessons.get(key);
      if (!existing || this.quality(inherited) > this.quality(existing)) {
        this.lessons.set(key, inherited);
      }
    }
  }

  add(lesson: LineageLesson): void {
    const key = `${lesson.strategyId}:${lesson.kind}:${lesson.context}:${lesson.lesson}`;
    const existing = this.lessons.get(key);
    if (!existing || this.quality(lesson) > this.quality(existing)) {
      this.lessons.set(key, { ...lesson });
    }
  }

  snapshot(): LineageSnapshot {
    return { generation: this.generation, lessons: [...this.lessons.values()] };
  }

  lessonsFor(strategyId: string, context: string): LineageLesson[] {
    return [...this.lessons.values()].filter(
      lesson => lesson.strategyId === strategyId && (lesson.context === context || lesson.context === '*')
    );
  }

  effectiveQuality(lesson: LineageLesson): number {
    const age = Math.max(0, this.generation - lesson.generation);
    return this.baseQuality(lesson) * Math.pow(0.9, age);
  }

  private quality(lesson: LineageLesson): number {
    return this.effectiveQuality(lesson);
  }

  private baseQuality(lesson: LineageLesson): number {
    return lesson.confidence * Math.max(1, lesson.occurrences) * Math.max(1, Math.abs(lesson.evidenceValue));
  }
}
