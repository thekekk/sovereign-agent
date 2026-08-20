import { OpportunityExecutorRegistry } from './opportunity-executor-registry.js';
import { SandboxExecutor } from './sandbox-executor.js';

export function createSandboxExecutorRegistry(): OpportunityExecutorRegistry {
  const registry = new OpportunityExecutorRegistry();
  registry.register(new SandboxExecutor());
  return registry;
}
