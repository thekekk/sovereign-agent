import { readFile, writeFile } from 'node:fs/promises';

export interface Soul {
  name: string;
  purpose: string;
  principles: string[];
  revision: number;
  updatedAt: string;
}

export class SoulStore {
  constructor(private readonly path = process.env.SOVEREIGN_SOUL ?? '.sovereign/SOUL.json') {}

  async load(fallback: Soul): Promise<Soul> {
    try { return JSON.parse(await readFile(this.path, 'utf8')) as Soul; } catch { return fallback; }
  }

  async save(soul: Soul): Promise<void> {
    const next = { ...soul, revision: soul.revision + 1, updatedAt: new Date().toISOString() };
    await writeFile(this.path, JSON.stringify(next, null, 2), { mode: 0o600 });
  }
}
