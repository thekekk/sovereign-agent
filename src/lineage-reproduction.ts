import type { LineageMemory, LineageSnapshot } from './lineage-memory.js';

export interface ChildLineage {
  generation: number;
  parentOriginId: string;
  memory: LineageMemory;
}

/** Reproduction boundary: copy durable lessons, never runtime execution state. */
export class LineageReproduction {
  createChild(parent: LineageSnapshot, childOriginId: string): ChildLineage {
    const memory = new (requireLineageMemory())(parent.generation + 1) as LineageMemory;
    memory.inherit(parent);
    return {
      generation: parent.generation + 1,
      parentOriginId: childOriginId,
      memory
    };
  }
}

// Kept behind a tiny factory to make the reproduction boundary explicit and testable.
function requireLineageMemory(): typeof LineageMemory {
  return LineageMemory;
}
