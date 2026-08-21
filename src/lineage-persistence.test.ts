import { describe, expect, it } from 'vitest';
import { LineageMemory } from './lineage-memory.js';
import { LineagePersistence } from './lineage-persistence.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function useLesson() {
  return {
    id: 'use:A:coding:verified mutation', strategyId: 'A', kind: 'use' as const,
    context: 'coding', lesson: 'verified mutation', evidenceValue: 10,
    confidence: 0.9, occurrences: 1, originId: 'child', generation: 2
  };
}

describe('lineage persistence', () => {
  it('restores learned knowledge into a fresh memory after restart', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sovereign-lineage-'));
    const db = join(dir, 'lineage.db');
    try {
      const first = new LineageMemory(2);
      first.add(useLesson());
      new LineagePersistence(db).save(first.snapshot());

      const fresh = new LineageMemory(3);
      new LineagePersistence(db).loadInto(fresh);
      expect(fresh.lessonsFor('A', 'coding')).toEqual([
        expect.objectContaining({ kind: 'use', strategyId: 'A', lesson: 'verified mutation', originId: 'child' })
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
