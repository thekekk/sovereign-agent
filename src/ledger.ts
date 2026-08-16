import { randomUUID } from 'node:crypto';

export interface OutcomeEvent {
  id: string;
  timestamp: string;
  strategy: string;
  success: boolean;
  value: number;
  cost: number;
  notes?: string;
}

export class OutcomeLedger {
  private readonly events: OutcomeEvent[] = [];

  record(input: Omit<OutcomeEvent, 'id' | 'timestamp'>): OutcomeEvent {
    const event: OutcomeEvent = { ...input, id: randomUUID(), timestamp: new Date().toISOString() };
    this.events.push(event);
    return event;
  }

  all(): readonly OutcomeEvent[] { return this.events; }

  strategyStats(): Map<string, { attempts: number; successes: number; failures: number; netValue: number }> {
    const stats = new Map<string, { attempts: number; successes: number; failures: number; netValue: number }>();
    for (const event of this.events) {
      const current = stats.get(event.strategy) ?? { attempts: 0, successes: 0, failures: 0, netValue: 0 };
      current.attempts++;
      if (event.success) current.successes++; else current.failures++;
      current.netValue += event.value - event.cost;
      stats.set(event.strategy, current);
    }
    return stats;
  }
}
