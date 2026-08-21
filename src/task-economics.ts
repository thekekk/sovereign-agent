import type { OutcomeEvent } from './outcome-ledger.js';
import { OutcomeLedger } from './outcome-ledger.js';

export interface TaskEconomicsInput {
  taskId: string;
  startedAtMs: number;
  finishedAtMs: number;
  costPerHour: number;
  value: number;
  success: boolean;
  source: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TaskEconomicsResult {
  event: OutcomeEvent & { id: string; timestamp: string };
  netValue: number;
  profitable: boolean;
}

/** Turns measured execution time and an external value estimate into one
 * durable economic outcome. Value is an observed/assigned task reward; this
 * module never moves real money. */
export class TaskEconomics {
  constructor(private readonly ledger = new OutcomeLedger()) {}

  record(input: TaskEconomicsInput): TaskEconomicsResult {
    if (!Number.isFinite(input.startedAtMs) || !Number.isFinite(input.finishedAtMs) || input.finishedAtMs < input.startedAtMs) {
      throw new Error('Invalid task timestamps');
    }
    if (!Number.isFinite(input.costPerHour) || input.costPerHour < 0) throw new Error('costPerHour must be finite and non-negative');
    if (!Number.isFinite(input.value)) throw new Error('value must be finite');

    const durationMs = input.finishedAtMs - input.startedAtMs;
    const cost = (durationMs / 3_600_000) * input.costPerHour;
    const event = this.ledger.record({
      taskId: input.taskId,
      kind: input.success ? 'success' : 'failure',
      durationMs,
      cost,
      value: input.value,
      source: input.source,
      metadata: input.metadata
    });

    const netValue = input.value - cost;
    return { event, netValue, profitable: netValue > 0 };
  }

  summary() {
    return this.ledger.summary();
  }
}
