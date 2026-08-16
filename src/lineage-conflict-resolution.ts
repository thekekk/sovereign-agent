import type { LineageLesson } from './lineage-memory.js';

export interface ResolvedLineageEvidence {
  use: readonly LineageLesson[];
  avoid: readonly LineageLesson[];
  winner: 'use' | 'avoid' | 'neutral';
  score: number;
}

export function resolveLineageConflict(
  lessons: readonly LineageLesson[],
  effectiveQuality?: (lesson: LineageLesson) => number
): ResolvedLineageEvidence {
  const use = lessons.filter(lesson => lesson.kind === 'use');
  const avoid = lessons.filter(lesson => lesson.kind === 'avoid');
  const score = scoreLessons(use, effectiveQuality) - scoreLessons(avoid, effectiveQuality);
  return { use, avoid, winner: score > 0 ? 'use' : score < 0 ? 'avoid' : 'neutral', score };
}

function scoreLessons(
  lessons: readonly LineageLesson[],
  effectiveQuality?: (lesson: LineageLesson) => number
): number {
  return lessons.reduce(
    (total, lesson) => total + (effectiveQuality?.(lesson) ?? baseQuality(lesson)),
    0
  );
}

function baseQuality(lesson: LineageLesson): number {
  return lesson.confidence * Math.max(1, lesson.occurrences) * Math.max(1, Math.abs(lesson.evidenceValue));
}
