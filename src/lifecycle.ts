import type { SurvivalSnapshot, SurvivalDecision } from './survival.js';
import { SurvivalEngine } from './survival.js';
import { EconomyEngine, type Allocation } from './economy.js';
import { EvolutionEngine, type Strategy, type EvolutionDecision } from './evolution.js';

export interface LifecycleState {
  snapshot: SurvivalSnapshot;
  survival: SurvivalDecision;
  allocation: Allocation;
  evolution: EvolutionDecision;
}

export class AutonomousLifecycle {
  private readonly survivalEngine = new SurvivalEngine();
  private readonly economyEngine = new EconomyEngine();
  private readonly evolutionEngine = new EvolutionEngine();

  evaluate(snapshot: SurvivalSnapshot, strategies: Strategy[], workers = 0): LifecycleState {
    const survival = this.survivalEngine.evaluate(snapshot);
    const allocation = this.economyEngine.allocate(snapshot, survival, workers);
    const evolution = allocation.approved
      ? this.evolutionEngine.decide(strategies, survival)
      : {
          selected: strategies.length ? strategies[0] : null,
          spawnWorker: false,
          reason: allocation.reason
        };
    return { snapshot, survival, allocation, evolution };
  }
}
