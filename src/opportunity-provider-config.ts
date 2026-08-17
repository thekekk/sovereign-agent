import type { OpportunityDomain } from './opportunity-bus.js';

export interface OpportunityProviderConfig {
  id: string;
  domain: OpportunityDomain;
  enabled: boolean;
  pollIntervalMs: number;
  timeoutMs: number;
  maxAgeMs: number;
  tags?: readonly string[];
}

export class OpportunityProviderConfigRegistry {
  private readonly configs = new Map<string, OpportunityProviderConfig>();

  register(config: OpportunityProviderConfig): void {
    if (config.pollIntervalMs <= 0 || config.timeoutMs <= 0 || config.maxAgeMs <= 0) throw new Error('provider timing values must be positive');
    if (this.configs.has(config.id)) throw new Error(`provider config already exists: ${config.id}`);
    this.configs.set(config.id, Object.freeze({ ...config, tags: config.tags ? [...config.tags] : [] }));
  }

  get(id: string): OpportunityProviderConfig | undefined { return this.configs.get(id); }
  enabled(): readonly OpportunityProviderConfig[] { return [...this.configs.values()].filter(config => config.enabled); }
}
