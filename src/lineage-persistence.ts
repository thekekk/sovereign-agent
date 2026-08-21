import Database from 'better-sqlite3';
import { LineageMemory, type LineageLesson, type LineageSnapshot } from './lineage-memory.js';

/** Durable storage for lineage knowledge; runtime state is intentionally excluded. */
export class LineagePersistence {
  private readonly db: Database.Database;

  constructor(path = process.env.SOVEREIGN_LINEAGE_DB ?? 'sovereign.db') {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS lineage_lessons (
      id TEXT PRIMARY KEY,
      strategy_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      context TEXT NOT NULL,
      lesson TEXT NOT NULL,
      evidence_value REAL NOT NULL,
      confidence REAL NOT NULL,
      occurrences INTEGER NOT NULL,
      origin_id TEXT NOT NULL,
      generation INTEGER NOT NULL,
      inherited_from TEXT
    );`);
  }

  save(snapshot: LineageSnapshot): void {
    const insert = this.db.prepare(`INSERT OR REPLACE INTO lineage_lessons
      (id,strategy_id,kind,context,lesson,evidence_value,confidence,occurrences,origin_id,generation,inherited_from)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    const tx = this.db.transaction((lessons: readonly LineageLesson[]) => {
      for (const l of lessons) insert.run(l.id,l.strategyId,l.kind,l.context,l.lesson,l.evidenceValue,l.confidence,l.occurrences,l.originId,l.generation,l.inheritedFrom ?? null);
    });
    tx(snapshot.lessons);
  }

  loadInto(memory: LineageMemory): void {
    const rows = this.db.prepare(`SELECT id,strategy_id AS strategyId,kind,context,lesson,
      evidence_value AS evidenceValue,confidence,occurrences,origin_id AS originId,
      generation,inherited_from AS inheritedFrom FROM lineage_lessons ORDER BY generation,id`).all() as LineageLesson[];
    for (const lesson of rows) memory.add(lesson);
  }

  loadSnapshot(generation: number): LineageSnapshot {
    const memory = new LineageMemory(generation);
    this.loadInto(memory);
    return memory.snapshot();
  }
}
