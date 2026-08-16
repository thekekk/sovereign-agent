import type { ChildLifecycleResult } from './child-ci-lifecycle.js';

export interface ParentFitnessDelta {
  childId: string;
  survived: boolean;
  fitnessDelta: number;
  reason: string;
}

/** Turns an externally observed child lifecycle result into bounded parent feedback. */
export class ChildSurvivalAccounting {
  constructor(private readonly survivalValue = 1, private readonly failurePenalty = 1) {
    if (survivalValue < 0 || failurePenalty < 0) throw new Error('fitness values must be non-negative');
  }

  record(childId: string, result: ChildLifecycleResult): ParentFitnessDelta {
    if (!childId.trim()) throw new Error('childId is required');
    if (result.state === 'survived') {
      return { childId, survived: true, fitnessDelta: this.survivalValue, reason: result.reason };
    }
    if (result.state === 'terminated') {
      return { childId, survived: false, fitnessDelta: -this.failurePenalty, reason: result.reason };
    }
    return { childId, survived: false, fitnessDelta: 0, reason: 'Child lifecycle remains unresolved' };
  }
}
