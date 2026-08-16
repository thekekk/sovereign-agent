import Database from 'better-sqlite3';
import type { AccountingEvent, AccountingKind, AccountingSummary } from './accounting.js';

export class DurableAccountingLedger {
  private readonly db: Database.Database;

  constructor(path = process.env.SOVEREIGN_DB ?? 'sovereign.db') {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounting_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        kind TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        source TEXT NOT NULL,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_accounting_timestamp ON accounting_events(timestamp);
    `);
  }

  record(event: AccountingEvent): void {
    if (!Number.isFinite(event.amount) || event.amount < 0) throw new Error('Invalid accounting amount');
    this.db.prepare(`
      INSERT INTO accounting_events (id, timestamp, kind, amount, currency, source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.timestamp,
      event.kind,
      event.amount,
      event.currency,
      event.source,
      JSON.stringify(event.metadata ?? {})
    );
  }

  summary(): AccountingSummary {
    const rows = this.db.prepare(
      'SELECT kind, SUM(amount) AS amount FROM accounting_events GROUP BY kind'
    ).all() as Array<{ kind: AccountingKind; amount: number }>;
    let revenue = 0;
    let cost = 0;
    const byKind: Record<string, number> = {};
    for (const row of rows) {
      const amount = Number(row.amount) || 0;
      byKind[row.kind] = amount;
      if (row.kind === 'revenue') revenue += amount;
      else cost += amount;
    }
    return { revenue, cost, net: revenue - cost, byKind };
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM accounting_events').get() as { count: number };
    return row.count;
  }
}
