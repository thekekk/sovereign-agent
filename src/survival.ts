export type LifeState = 'thriving' | 'stable' | 'stressed' | 'critical' | 'dead';

export interface SurvivalSnapshot {
  balance: number;
  computeCostPerHour: number;
  revenuePerHour: number;
  health: number;
  offspring: number;
  successes: number;
  failures: number;
  lastHeartbeat: string;
}

export interface SurvivalDecision {
  state: LifeState;
  runwayHours: number;
  priority: 'grow' | 'maintain' | 'recover' | 'shutdown';
  reason: string;
}

/**
 * Economic survival model. This is intentionally a simulation/policy layer:
 * it gives the agent a persistent objective signal without granting it
 * unrestricted access to money, credentials, or the host.
 */
export class SurvivalEngine {
  constructor(private readonly minimumBalance = 0) {}

  evaluate(s: SurvivalSnapshot): SurvivalDecision {
    const burn = Math.max(0, s.computeCostPerHour - s.revenuePerHour);
    const runwayHours = burn === 0 ? Infinity : Math.max(0, s.balance / burn);

    if (s.balance <= this.minimumBalance || s.health <= 0) {
      return { state: 'dead', runwayHours, priority: 'shutdown', reason: 'Resources or health exhausted' };
    }
    if (runwayHours < 2 || s.health < 20) {
      return { state: 'critical', runwayHours, priority: 'recover', reason: 'Immediate survival risk' };
    }
    if (runwayHours < 12 || s.health < 50) {
      return { state: 'stressed', runwayHours, priority: 'recover', reason: 'Limited runway or degraded health' };
    }
    if (s.revenuePerHour > s.computeCostPerHour && s.successes > s.failures) {
      return { state: 'thriving', runwayHours, priority: 'grow', reason: 'Positive unit economics and successful work' };
    }
    return { state: 'stable', runwayHours, priority: 'maintain', reason: 'Survival margin is currently adequate' };
  }
}
