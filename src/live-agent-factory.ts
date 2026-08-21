import { OpportunityProviderRegistry } from './opportunity-provider-registry.js';
import { OpportunityFreshnessPolicy } from './opportunity-freshness.js';
import { createConfiguredDomainFeeds } from './env-domain-feeds.js';
import { createLiveDiscoveryRuntime } from './live-discovery-runtime.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import { WalletServiceMatrix, type WalletServiceRule } from './wallet-service-matrix.js';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import { OpportunityPolicy, type OpportunityPolicyConfig } from './opportunity-policy.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import { OpportunityExecutorRegistry } from './opportunity-executor-registry.js';
import { OpportunityOutcomeLearning } from './opportunity-outcome-learning.js';

export interface LiveAgentFactoryConfig {
  freshness: OpportunityFreshnessPolicy;
  serviceRules: readonly WalletServiceRule[];
  policy: OpportunityPolicyConfig;
}

export function createLiveAgentComponents(env: NodeJS.ProcessEnv, config: LiveAgentFactoryConfig) {
  const providers = new OpportunityProviderRegistry();
  const feeds = createConfiguredDomainFeeds(env);
  const discovery = createLiveDiscoveryRuntime(providers, feeds, config.freshness).discovery;
  const capabilityGate = new OpportunityDecisionGate(new WalletServiceMatrix(config.serviceRules));
  const executionGate = new OpportunityExecutionGate();
  const executors = new OpportunityExecutorRegistry();
  const learning = new OpportunityOutcomeLearning();
  const decision = new OpportunityDecisionPolicy(new OpportunityPolicy(config.policy), executionGate);
  const execution = new OpportunityExecutionOrchestrator(executionGate, executors, learning);
  return { providers, discovery, gate: capabilityGate, decision, execution, learning };
}
