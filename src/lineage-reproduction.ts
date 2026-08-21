import { LineageMemory, type LineageSnapshot } from './lineage-memory.js';

export interface ChildLineage {
  generation: number;
  parentOriginId: string;
  memory: LineageMemory;
}

/** Reproduction boundary: copy durable lessons, never runtime execution state. */
export class LineageReproduction {
  createChild(parent: LineageSnapshot, childOriginId: string): ChildLineage {
    const memory = new LineageMemory(parent.generation + 1);
    memory.inherit(parent);
    return {
      generation: parent.generation + 1,
      parentOriginId: childOriginId,
      memory
    };
  }
}
