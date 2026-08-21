import { createRuntime, type RuntimeDependencies } from './runtime-factory.js';
import { createConfiguredDiscovery } from './configured-discovery.js';
import { loadProviderConfigs } from './provider-config.js';
import { loadWalletConfigs } from './wallet-config.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export interface ConfiguredRuntime {
  runtime: ReturnType<typeof createRuntime>;
  wallets: ReturnType<typeof loadWalletConfigs>;
}

export function createConfiguredRuntime(
  dependencies: Omit<RuntimeDependencies, 'discovery'>,
  feeds: readonly LiveDomainFeed[],
  env: Record<string, string | undefined> = process.env
): ConfiguredRuntime {
  const configs = loadProviderConfigs(env);
  const discovery = createConfiguredDiscovery(configs, feeds);
  const runtime = createRuntime({ ...dependencies, discovery }, env);
  return { runtime, wallets: loadWalletConfigs(env) };
}
