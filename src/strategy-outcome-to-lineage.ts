import type { LineageLesson, LineageMemory } from './lineage-memory.js';
import type { LineagePersistence } from './lineage-persistence.js';

export interface StrategyOutcomeLineageInput {
  strategyId: string;
  context: string;
  originId: string;
  verified: boolean;
  value: number;
  lesson: string;
}

/** Converts durable worker outcomes into inherited USE/AVOID knowledge. */
export class StrategyOutcomeToLineage {
  constructor(
    private readonly lineage: LineageMemory,
    private readonly persistence?: Pick<LineagePersistence, 'save'>
  ) {}

  record(input: StrategyOutcomeLineageInput): LineageLesson {
    if (!input.strategyId.trim()) throw new Error('strategyId is required');
    if (!input.context.trim()) throw new Error('context is required');
    if (!input.originId.trim()) throw new Error('originId is required');
    if (!input.lesson.trim()) throw new Error('lesson is required');
    if (!Number.isFinite(input.value) || input.value < 0) throw new Error('value must be finite and non-negative');

    const kind = input.verified ? 'use' : 'avoid';
    const lesson: LineageLesson = {
      id: `${kind}:${input.strategyId}:${input.context}:${input.lesson}`,
      strategyId: input.strategyId,
      kind,
      context: input.context,
      lesson: input.lesson,
      evidenceValue: input.verified ? input.value : 0,
      confidence: input.verified ? 0.7 : 0.8,
      occurrences: 1,
      originId: input.originId,
      generation: this.lineage.snapshot().generation
    };
    this.lineage.add(lesson);
    this.persistence?.save(this.lineage.snapshot());
    return lesson;
  }
}
