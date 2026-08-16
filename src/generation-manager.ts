import { EvolutionController, type EvolutionDecision, type EvolutionInput } from './evolution-controller.js';
import { ChildCiLifecycle, type ChildCiObservation, type ChildLifecycleResult } from './child-ci-lifecycle.js';
import { ChildSurvivalAccounting, type ParentFitnessDelta } from './child-survival-accounting.js';

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
    private readonly accounting = new ChildSurvivalAccounting()
  ) {}

  evaluate(input: EvolutionInput): GenerationEvaluation {
    return {
      generation: input.population.generation,
      decision: this.evolution.decide(input)
    };
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
    const fitness = this.accounting.record(childId, lifecycle.state);
    return { childId, generation, lifecycle, fitness };
  }
}
