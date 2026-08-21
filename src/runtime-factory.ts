import { loadRuntimeConfig, type RuntimeConfig } from './runtime-config.js';
import { createSandboxExecutorRegistry } from './sandbox-runtime.js';
import { OpportunityExecutionOrchestrator } from './opportunity-execution-orchestrator.js';
import { OpportunityRuntime } from './opportunity-runtime.js';
import { DomainPolicyGate } from './domain-policy-gate.js';
import { DEFAULT_DOMAIN_POLICIES } from './domain-opportunity-config.js';
import { ExecutionLimitsGuard } from './execution-limits.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';

export interface RuntimeDependencies {
  discovery: ConstructorParameters<typeof OpportunityRuntime>[0];
  decision: ConstructorParameters<typeof OpportunityRuntime>[1];
  capabilityGate: ConstructorParameters<typeof OpportunityRuntime>[3];
  learning: ConstructorParameters<typeof OpportunityExecutionOrchestrator>[2];
}

export function createRuntime(dependencies: RuntimeDependencies, env?: Record<string, string | undefined>): OpportunityRuntime {
  const config: RuntimeConfig = loadRuntimeConfig(env);
  if (config.mode !== 'sandbox') throw new Error('live runtime assembly requires a dedicated live executor factory');
  const registry = createSandboxExecutorRegistry();
  const executionGate = new OpportunityExecutionGate();
  const execution = new OpportunityExecutionOrchestrator(
    executionGate,
    registry,
    dependencies.learning,
    undefined,
    new ExecutionLimitsGuard({ maxEstimatedCost: 1000, maxEstimatedRisk: .5 })
  );
  return new OpportunityRuntime(
    dependencies.discovery,
    dependencies.decision,
    execution,
    dependencies.capabilityGate,
    new DomainPolicyGate(DEFAULT_DOMAIN_POLICIES)
  );
}
