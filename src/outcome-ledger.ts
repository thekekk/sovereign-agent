import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export type OutcomeKind = 'success' | 'failure';

export interface OutcomeEvent {
  id?: string;
  taskId: string;
  timestamp?: string;
  kind: OutcomeKind;
  durationMs: number;
  cost: number;
  value: number;
  source: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface OutcomeSummary {
  successes: number;
  failures: number;
  totalCost: number;
  totalValue: number;
  successRate: number;
}

/** Durable task outcomes used as a bounded learning/economic signal. */
export class OutcomeLedger {
  private readonly db: Database.Database;

  constructor(path = process.env.SOVEREIGN_OUTCOME_DB ?? 'sovereign.db') {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS outcome_events (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('success', 'failure')),
        duration_ms INTEGER NOT NULL,
        cost REAL NOT NULL,
        value REAL NOT NULL,
        source TEXT NOT NULL,
        metadata_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_outcome_task ON outcome_events(task_id);
      CREATE INDEX IF NOT EXISTS idx_outcome_timestamp ON outcome_events(timestamp);
    `);
  }

  record(event: OutcomeEvent): OutcomeEvent & { id: string; timestamp: string } {
    if (!Number.isFinite(event.durationMs) || event.durationMs < 0) throw new Error('durationMs must be finite and non-negative');
    if (!Number.isFinite(event.cost) || event.cost < 0) throw new Error('cost must be finite and non-negative');
    if (!Number.isFinite(event.value)) throw new Error('value must be finite');
    if (!event.taskId.trim() || !event.source.trim()) throw new Error('taskId and source are required');

    const stored = {
      id: event.id ?? randomUUID(),
      taskId: event.taskId,
      timestamp: event.timestamp ?? new Date().toISOString(),
      kind: event.kind,
      durationMs: Math.round(event.durationMs),
      cost: event.cost,
      value: event.value,
      source: event.source,
      metadata: event.metadata
    };

    this.db.prepare(`
      INSERT INTO outcome_events
        (id, task_id, timestamp, kind, duration_ms, cost, value, source, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      stored.id,
      stored.taskId,
      stored.timestamp,
      stored.kind,
      stored.durationMs,
      stored.cost,
      stored.value,
      stored.source,
      stored.metadata ? JSON.stringify(stored.metadata) : null
    );

    return stored;
  }

  summary(): OutcomeSummary {
    const row = this.db.prepare(`
      SELECT
        SUM(CASE WHEN kind = 'success' THEN 1 ELSE 0 END) AS successes,
        SUM(CASE WHEN kind = 'failure' THEN 1 ELSE 0 END) AS failures,
        COALESCE(SUM(cost), 0) AS totalCost,
        COALESCE(SUM(value), 0) AS totalValue
      FROM outcome_events
    `).get() as { successes: number | null; failures: number | null; totalCost: number; totalValue: number };

    const successes = row.successes ?? 0;
    const failures = row.failures ?? 0;
    const total = successes + failures;
    return {
      successes,
      failures,
      totalCost: row.totalCost,
      totalValue: row.totalValue,
      successRate: total === 0 ? 0 : successes / total
    };
  }

  recent(limit = 20): readonly OutcomeEvent[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('limit must be an integer from 1 to 1000');
    const rows = this.db.prepare(`
      SELECT id, task_id AS taskId, timestamp, kind, duration_ms AS durationMs,
             cost, value, source, metadata_json AS metadataJson
      FROM outcome_events ORDER BY timestamp DESC LIMIT ?
    `).all(limit) as Array<OutcomeEvent & { id: string; metadataJson?: string | null }>;

    return rows.map(row => ({
      ...row,
      metadata: row.metadataJson ? JSON.parse(row.metadataJson) as Record<string, string | number | boolean> : undefined
    }));
  }
}
