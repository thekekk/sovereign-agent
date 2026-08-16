import type { SurvivalDecision } from './survival.js';

export interface Strategy {
  id: string;
  description: string;
  expectedValue: number;
  attempts: number;
  successes: number;
  failures: number;
}

export interface EvolutionDecision {
  selected: Strategy | null;
  spawnWorker: boolean;
  reason: string;
}

/** Selects strategies from observed outcomes. It never creates processes itself. */
export class EvolutionEngine {
  decide(strategies: Strategy[], survival: SurvivalDecision): EvolutionDecision {
    if (survival.priority === 'shutdown') {
      return { selected: null, spawnWorker: false, reason: 'Do not expand after death condition' };
    }

    const ranked = [...strategies].sort((a, b) => {
      const aRate = a.attempts ? a.successes / a.attempts : 0;
      const bRate = b.attempts ? b.successes / b.attempts : 0;
      return (b.expectedValue + bRate) - (a.expectedValue + aRate);
    });

    const selected = ranked[0] ?? null;
    const spawnWorker = survival.priority === 'grow' && !!selected;
    return {
      selected,
      spawnWorker,
      reason: spawnWorker
        ? 'Positive economics justify controlled replication'
        : selected ? 'Continue the strongest known strategy' : 'No tested strategy available'
    };
  }
}
