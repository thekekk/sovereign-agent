import type { Opportunity } from './opportunity-bus.js';
import { OpportunityProviderCircuit } from './opportunity-provider-circuit.js';
import type { OpportunityProvider } from './opportunity-provider-registry.js';

export interface ProviderManagerResult {
  opportunities: readonly Opportunity[];
  attempted: number;
  skippedOpen: number;
  failed: number;
}

export class OpportunityProviderManager {
  constructor(
    private readonly providers: readonly OpportunityProvider[],
    private readonly circuit: OpportunityProviderCircuit
  ) {}

  async discover(signal: AbortSignal = new AbortController().signal, nowMs = Date.now()): Promise<ProviderManagerResult> {
    const eligible = this.providers.filter(provider => this.circuit.allow(provider.id, nowMs));
    const skippedOpen = this.providers.length - eligible.length;
    const results: Opportunity[] = [];
    let failed = 0;
    await Promise.all(eligible.map(async provider => {
      try {
        results.push(...await provider.discover(signal));
        this.circuit.success(provider.id);
      } catch {
        failed += 1;
        this.circuit.failure(provider.id, nowMs);
      }
    }));
    return { opportunities: results, attempted: eligible.length, skippedOpen, failed };
  }
}
