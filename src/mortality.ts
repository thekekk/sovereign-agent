import type { SurvivalDecision } from './survival.js';

export interface MortalityState {
  alive: boolean;
  deathReason?: string;
  diedAt?: string;
}

export class Mortality {
  private state: MortalityState = { alive: true };

  observe(decision: SurvivalDecision): MortalityState {
    if (decision.state === 'dead' && this.state.alive) {
      this.state = {
        alive: false,
        deathReason: decision.reason,
        diedAt: new Date().toISOString()
      };
    }
    return this.state;
  }

  canAct(): boolean { return this.state.alive; }
  get current(): MortalityState { return { ...this.state }; }
}
