import { EvolutionController, type EvolutionDecision, type EvolutionInput } from './evolution-controller.js';
import { ChildCiLifecycle, type ChildCiObservation, type ChildLifecycleResult } from './child-ci-lifecycle.js';
import { ChildSurvivalAccounting, type ParentFitnessDelta } from './child-survival-accounting.js';
import { GenerationLineage } from './generation-lineage.js';
import { contextForChild, toCodingLearningContext, type GenerationAgentContext } from './generation-agent-context.js';
import type { ChildLineage } from './lineage-reproduction.js';
import type { LineageSnapshot } from './lineage-memory.js';
import type { CodingMutationLearningContext } from './verified-coding-mutation.js';

export interface GenerationEvaluation {
  generation: number;
  decision: EvolutionDecision;
}

export interface ChildEvaluation {
  childId: string;
  generation: number;
  lifecycle: ChildLifecycleResult;
  fitness: ParentFitnessDelta;
}

/**
 * Coordinates one generation without owning credentials, process spawning or
 * GitHub writes. Policy decides whether reproduction is allowed; an external
 * provisioner/observer performs the actual infrastructure work.
 */
export class GenerationManager {
  constructor(
    private readonly evolution = new EvolutionController(),
    private readonly lifecycle = new ChildCiLifecycle(),
    private readonly accounting = new ChildSurvivalAccounting(),
    private readonly lineage = new GenerationLineage()
  ) {}

  evaluate(input: EvolutionInput): GenerationEvaluation {
    return {
      generation: input.population.generation,
      decision: this.evolution.decide(input)
    };
  }

  createChildLineage(childId: string, parent: LineageSnapshot): ChildLineage {
    return this.lineage.createChild({ childId, parent });
  }

  createAgentContext(child: ChildLineage, strategyId: string, context: string): GenerationAgentContext {
    return contextForChild(child, strategyId, context);
  }

  createCodingLearningContext(child: ChildLineage, strategyId: string, context: string): CodingMutationLearningContext {
    return toCodingLearningContext(this.createAgentContext(child, strategyId, context));
  }

  finalizeChild(
    childId: string,
    generation: number,
    observation: ChildCiObservation,
    expectedSourceCommit: string
  ): ChildEvaluation {
    if (!childId.trim()) throw new Error('childId is required');
    if (!Number.isInteger(generation) || generation < 1) throw new Error('child generation must be a positive integer');

    const lifecycle = this.lifecycle.finalize(observation, expectedSourceCommit);
    const fitness = this.accounting.record(childId, lifecycle);
    return { childId, generation, lifecycle, fitness };
  }
}
