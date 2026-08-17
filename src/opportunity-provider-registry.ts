import type { Opportunity } from './opportunity-bus.js';

export interface OpportunityProvider {
  readonly id: string;
  discover(signal: AbortSignal): Promise<readonly Opportunity[]>;
}

export interface ProviderHealth {
  successes: number;
  failures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
}

export class OpportunityProviderRegistry {
  private readonly providers = new Map<string, OpportunityProvider>();
  private readonly health = new Map<string, ProviderHealth>();

  register(provider: OpportunityProvider): void {
    if (this.providers.has(provider.id)) throw new Error(`provider already registered: ${provider.id}`);
    this.providers.set(provider.id, provider);
    this.health.set(provider.id, { successes: 0, failures: 0 });
  }

  getHealth(id: string): ProviderHealth | undefined {
    const value = this.health.get(id);
    return value ? { ...value } : undefined;
  }

  async discover(signal: AbortSignal = new AbortController().signal): Promise<Opportunity[]> {
    const results: Opportunity[] = [];
    await Promise.all([...this.providers.values()].map(async provider => {
      try {
        const found = await provider.discover(signal);
        results.push(...found);
        const health = this.health.get(provider.id)!;
        health.successes += 1;
        health.lastSuccessAt = new Date().toISOString();
      } catch {
        const health = this.health.get(provider.id)!;
        health.failures += 1;
        health.lastFailureAt = new Date().toISOString();
      }
    }));
    return results;
  }
}
