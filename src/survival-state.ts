import Database from 'better-sqlite3';
import type { SurvivalSnapshot } from './survival.js';
import { AccountingLedger } from './accounting.js';

interface StoredState {
  id: number;
  balance: number;
  computeCostPerHour: number;
  revenuePerHour: number;
  health: number;
  offspring: number;
  successes: number;
  failures: number;
  lastHeartbeat: string;
}

export class DurableSurvivalState {
  private readonly db: Database.Database;

  constructor(path = process.env.SOVEREIGN_DB ?? 'sovereign.db') {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS survival_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        balance REAL NOT NULL,
        compute_cost_per_hour REAL NOT NULL,
        revenue_per_hour REAL NOT NULL,
        health REAL NOT NULL,
        offspring INTEGER NOT NULL,
        successes INTEGER NOT NULL,
        failures INTEGER NOT NULL,
        last_heartbeat TEXT NOT NULL
      );
    `);
  }

  load(): SurvivalSnapshot | undefined {
    const row = this.db.prepare('SELECT * FROM survival_state WHERE id = 1').get() as StoredState | undefined;
    if (!row) return undefined;
    return {
      balance: row.balance,
      computeCostPerHour: row.compute_cost_per_hour,
      revenuePerHour: row.revenue_per_hour,
      health: row.health,
      offspring: row.offspring,
      successes: row.successes,
      failures: row.failures,
      lastHeartbeat: row.last_heartbeat
    };
  }

  save(snapshot: SurvivalSnapshot): void {
    this.db.prepare(`
      INSERT INTO survival_state
        (id, balance, compute_cost_per_hour, revenue_per_hour, health, offspring, successes, failures, last_heartbeat)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        balance=excluded.balance,
        compute_cost_per_hour=excluded.compute_cost_per_hour,
        revenue_per_hour=excluded.revenue_per_hour,
        health=excluded.health,
        offspring=excluded.offspring,
        successes=excluded.successes,
        failures=excluded.failures,
        last_heartbeat=excluded.last_heartbeat
    `).run(
      snapshot.balance,
      snapshot.computeCostPerHour,
      snapshot.revenuePerHour,
      snapshot.health,
      snapshot.offspring,
      snapshot.successes,
      snapshot.failures,
      snapshot.lastHeartbeat
    );
  }

  applyAccounting(snapshot: SurvivalSnapshot, ledger: AccountingLedger, hours = 1): SurvivalSnapshot {
    if (!Number.isFinite(hours) || hours < 0) throw new Error('hours must be a finite non-negative number');
    const summary = ledger.summary();
    const burn = Math.max(0, summary.cost);
    const earned = Math.max(0, summary.revenue);
    return {
      ...snapshot,
      balance: Math.max(0, snapshot.balance + earned - burn),
      computeCostPerHour: hours > 0 ? burn / hours : snapshot.computeCostPerHour,
      revenuePerHour: hours > 0 ? earned / hours : snapshot.revenuePerHour,
      lastHeartbeat: new Date().toISOString()
    };
  }
}
