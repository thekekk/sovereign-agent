export interface ProviderCircuitConfig {
  failureThreshold: number;
  cooldownMs: number;
}

interface CircuitState {
  failures: number;
  openedAt?: number;
}

export class OpportunityProviderCircuit {
  private readonly states = new Map<string, CircuitState>();

  constructor(private readonly config: ProviderCircuitConfig) {
    if (config.failureThreshold < 1) throw new Error('failureThreshold must be positive');
    if (config.cooldownMs < 0) throw new Error('cooldownMs must be non-negative');
  }

  allow(providerId: string, nowMs = Date.now()): boolean {
    const state = this.states.get(providerId);
    if (!state?.openedAt) return true;
    if (nowMs - state.openedAt >= this.config.cooldownMs) {
      this.states.set(providerId, { failures: 0 });
      return true;
    }
    return false;
  }

  success(providerId: string): void {
    this.states.set(providerId, { failures: 0 });
  }

  failure(providerId: string, nowMs = Date.now()): void {
    const state = this.states.get(providerId) ?? { failures: 0 };
    state.failures += 1;
    if (state.failures >= this.config.failureThreshold) state.openedAt = nowMs;
    this.states.set(providerId, state);
  }

  isOpen(providerId: string, nowMs = Date.now()): boolean {
    return !this.allow(providerId, nowMs);
  }
}
