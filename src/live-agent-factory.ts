import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { createConfiguredDomainFeeds } from './env-domain-feeds.js';
import { createLiveDiscoveryRuntime } from './live-discovery-runtime.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import { WalletServiceMatrix, type WalletServiceRule } from './wallet-service-matrix.js';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';

export interface LiveAgentFactoryConfig {
  freshness: OpportunityFreshnessPolicy;
  serviceRules: readonly WalletServiceRule[];
}

export function createLiveAgentComponents(env: NodeJS.ProcessEnv, config: LiveAgentFactoryConfig) {
  const providers = new OpportunityProviderRegistry();
  const feeds = createConfiguredDomainFeeds(env);
  const discovery = createLiveDiscoveryRuntime(providers, feeds, config.freshness).discovery;
  const gate = new OpportunityDecisionGate(new WalletServiceMatrix(config.serviceRules));
  return {
    discovery,
    gate,
    decision: new OpportunityDecisionPolicy(),
    execution: new OpportunityExecutionOrchestrator()
  };
}
