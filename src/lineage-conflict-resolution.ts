import type { StrategyLesson } from './strategy-memory.js';

export interface ResolvedLineageEvidence {
  use: readonly StrategyLesson[];
  avoid: readonly StrategyLesson[];
  winner: 'use' | 'avoid' | 'neutral';
  score: number;
}

export function resolveLineageConflict(
  lessons: readonly StrategyLesson[],
  effectiveQuality?: (lesson: StrategyLesson) => number
): ResolvedLineageEvidence {
  const use = lessons.filter(lesson => lesson.kind === 'use');
  const avoid = lessons.filter(lesson => lesson.kind === 'avoid');
  const score = scoreLessons(use, effectiveQuality) - scoreLessons(avoid, effectiveQuality);
  return { use, avoid, winner: score > 0 ? 'use' : score < 0 ? 'avoid' : 'neutral', score };
}

function scoreLessons(
  lessons: readonly StrategyLesson[],
  effectiveQuality?: (lesson: StrategyLesson) => number
): number {
  return lessons.reduce(
    (total, lesson) => total + (effectiveQuality?.(lesson) ?? baseQuality(lesson)),
    0
  );
}

function baseQuality(lesson: StrategyLesson): number {
  return lesson.confidence * Math.max(1, lesson.occurrences) * Math.max(1, Math.abs(lesson.evidenceValue));
}
