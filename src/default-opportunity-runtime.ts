import { createConfiguredDiscovery } from './configured-discovery.js';
import { OpportunityDecisionGate } from './opportunity-decision-gate.js';
import { OpportunityDecisionPolicy } from './opportunity-decision-policy.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import { OpportunityOutcomeLearning } from './opportunity-outcome-learning.js';
import { OpportunityPolicy } from './opportunity-policy.js';
import { WalletServiceMatrix } from './wallet-service-matrix.js';
import { DomainPolicyGate } from './domain-policy-gate.js';
import { DEFAULT_DOMAIN_POLICIES } from './domain-opportunity-config.js';
import { createRuntime } from './runtime-factory.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';
import type { ProviderConfig } from './provider-config.js';
import type { RuntimeDependencies } from './runtime-factory.js';

const DEFAULT_POLICY = {
  maxRisk: 0.5,
  minEvidenceConfidence: 0.8,
  minNetValue: 1,
  maxCost: 1000,
  minLiquidity: 0.5,
};

export function createDefaultSandboxRuntime(
  configs: readonly ProviderConfig[],
  feeds: readonly LiveDomainFeed[],
  env: Record<string, string | undefined> = process.env,
) {
  const discovery = createConfiguredDiscovery(configs, feeds);
  const services = configs.map(config => ({
    service: config.service,
    domains: [config.domain] as any,
    enabled: config.enabled !== false,
  }));
  const matrix = new WalletServiceMatrix(services);
  const decisionGate = new OpportunityDecisionGate(matrix);
  const executionGate = new OpportunityExecutionGate();
  const decision = new OpportunityDecisionPolicy(new OpportunityPolicy(DEFAULT_POLICY), executionGate);
  const learning = new OpportunityOutcomeLearning();
  const dependencies: RuntimeDependencies = {
    discovery,
    decision,
    capabilityGate: decisionGate,
    learning,
  };
  return createRuntime(dependencies, env);
}

export { DEFAULT_POLICY };
