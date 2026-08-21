import { createRuntime } from './runtime-factory.js';
import { createDefaultSandboxRuntime } from './default-opportunity-runtime.js';
import { loadWalletConfigs } from './wallet-config.js';
import { loadProviderConfigs } from './provider-config.js';
import type { LiveDomainFeed } from './live-opportunity-adapter.js';

export interface StartupState {
  mode: 'sandbox';
  walletCount: number;
  providerCount: number;
}

export function startSandboxRuntime(
  dependencies: Parameters<typeof createRuntime>[0],
  env: Record<string, string | undefined> = process.env
): { runtime: ReturnType<typeof createRuntime>; state: StartupState } {
  const wallets = loadWalletConfigs(env);
  const providers = loadProviderConfigs(env);
  const runtime = createRuntime(dependencies, env);
  return {
    runtime,
    state: { mode: 'sandbox', walletCount: wallets.length, providerCount: providers.length }
  };
}

export function startConfiguredSandboxRuntime(
  feeds: readonly LiveDomainFeed[],
  env: Record<string, string | undefined> = process.env
): { runtime: ReturnType<typeof createDefaultSandboxRuntime>; state: StartupState } {
  const wallets = loadWalletConfigs(env);
  const providers = loadProviderConfigs(env);
  const runtime = createDefaultSandboxRuntime(providers, feeds, env);
  return {
    runtime,
    state: { mode: 'sandbox', walletCount: wallets.length, providerCount: providers.length }
  };
}
