import type { LineageSnapshot } from './lineage-memory.js';
import { LineageReproduction, type ChildLineage } from './lineage-reproduction.js';

export interface ChildLineageInput {
  childId: string;
  parent: LineageSnapshot;
}

/** Generation boundary: create a fresh child lineage from durable parent knowledge. */
export class GenerationLineage {
  constructor(private readonly reproduction = new LineageReproduction()) {}

  createChild(input: ChildLineageInput): ChildLineage {
    if (!input.childId.trim()) throw new Error('childId is required');
    return this.reproduction.createChild(input.parent, input.childId);
  }
}
