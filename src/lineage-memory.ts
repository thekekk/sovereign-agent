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
      const key = `${lesson.strategy}:${lesson.type}:${lesson.context}:${lesson.lesson}`;
      const existing = this.lessons.get(key);
      if (!existing || lesson.confidence > existing.confidence) {
        this.lessons.set(key, {
          ...lesson,
          originId: lesson.originId,
          generation: this.generation,
          inheritedFrom: lesson.originId
        });
      }
    }
  }

  add(lesson: LineageLesson): void {
    const key = `${lesson.strategy}:${lesson.type}:${lesson.context}:${lesson.lesson}`;
    this.lessons.set(key, { ...lesson, generation: this.generation });
  }

  snapshot(): LineageSnapshot {
    return { generation: this.generation, lessons: [...this.lessons.values()] };
  }

  lessonsFor(strategy: string, context: string): LineageLesson[] {
    return [...this.lessons.values()].filter(
      lesson => lesson.strategy === strategy && (lesson.context === context || lesson.context === '*')
    );
  }
}
