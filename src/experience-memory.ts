import type { OutcomeLedger, OutcomeEvent } from './outcome-ledger.js';

export interface Experience {
  taskId: string;
  source: string;
  kind: 'success' | 'failure';
  value: number;
  cost: number;
  lesson: string;
  recordedAt: string;
}

/** Bounded, evidence-backed experience derived only from durable outcomes. */
export class ExperienceMemory {
  constructor(private readonly ledger: OutcomeLedger) {}

  recordFromOutcome(event: OutcomeEvent & { id: string; timestamp: string }): Experience {
    const lesson = event.kind === 'success'
      ? `Successful ${event.source} outcome; preserve the strategy that produced verified value.`
      : `Failed ${event.source} outcome; avoid repeating the strategy without a recovery or new evidence.`;
    return {
      taskId: event.taskId,
      source: event.source,
      kind: event.kind,
      value: event.value,
      cost: event.cost,
      lesson,
      recordedAt: event.timestamp
    };
  }

  recent(limit = 20): readonly Experience[] {
    return this.ledger.recent(limit).map(event => this.recordFromOutcome(event as OutcomeEvent & { id: string; timestamp: string }));
  }

  strategySignal(limit = 20): { successes: number; failures: number; netValue: number; lessons: readonly string[] } {
    const experiences = this.recent(limit);
    return {
      successes: experiences.filter(item => item.kind === 'success').length,
      failures: experiences.filter(item => item.kind === 'failure').length,
      netValue: experiences.reduce((sum, item) => sum + item.value - item.cost, 0),
      lessons: experiences.map(item => item.lesson)
    };
  }
}
