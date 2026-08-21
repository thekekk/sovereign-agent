import type { LineageLesson } from './lineage-memory.js';

export interface ResolvedLineageEvidence {
  use: readonly LineageLesson[];
  avoid: readonly LineageLesson[];
  winner: 'use' | 'avoid' | 'neutral';
  score: number;
}

const QUARANTINE_CONTRADICTIONS = 2;

export function resolveLineageConflict(
  lessons: readonly LineageLesson[],
  effectiveQuality?: (lesson: LineageLesson) => number
): ResolvedLineageEvidence {
  const rawUse = lessons.filter(lesson => lesson.kind === 'use');
  const rawAvoid = lessons.filter(lesson => lesson.kind === 'avoid');
  const useScore = scoreLessons(rawUse, effectiveQuality);
  const avoidScore = scoreLessons(rawAvoid, effectiveQuality);
  const score = useScore - avoidScore;

  // Repeated independent contradiction quarantines the losing knowledge from
  // downstream reuse. We keep it out of the returned reusable set, while the
  // underlying lesson remains stored for provenance/audit and future evidence.
  const use = score < 0 && independentOrigins(rawAvoid).size >= QUARANTINE_CONTRADICTIONS
    ? []
    : rawUse;
  const avoid = score > 0 && independentOrigins(rawUse).size >= QUARANTINE_CONTRADICTIONS
    ? []
    : rawAvoid;

  return {
    use,
    avoid,
    winner: score > 0 ? 'use' : score < 0 ? 'avoid' : 'neutral',
    score
  };
}

function independentOrigins(lessons: readonly LineageLesson[]): Set<string> {
  return new Set(lessons.map(lesson => lesson.originId));
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
