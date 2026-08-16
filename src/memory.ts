import Database from 'better-sqlite3';

export class Memory {
  private db: Database.Database;

  constructor(path = process.env.SOVEREIGN_DB ?? 'sovereign.db') {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
    `);
  }

  set(key: string, value: unknown): void {
    this.db.prepare(
      'INSERT INTO memories (key, value, created_at) VALUES (?, ?, ?)'
    ).run(key, JSON.stringify(value), new Date().toISOString());
  }

  get<T = unknown>(key: string): T | undefined {
    const row = this.db.prepare(
      'SELECT value FROM memories WHERE key = ? ORDER BY id DESC LIMIT 1'
    ).get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) as T : undefined;
  }

  search(key: string, limit = 20): unknown[] {
    return this.db.prepare(
      'SELECT key, value, created_at FROM memories WHERE key LIKE ? ORDER BY id DESC LIMIT ?'
    ).all(`%${key}%`, limit);
  }
}
