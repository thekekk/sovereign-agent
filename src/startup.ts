import { createRuntime } from './runtime-factory.js';
import { loadWalletConfigs } from './wallet-config.js';
import { loadProviderConfigs } from './provider-config.js';

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
