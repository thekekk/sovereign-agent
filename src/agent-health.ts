import type { OpportunityProviderConfig } from './opportunity-provider-config.js';
import type { AgentWallet } from './wallet-factory.js';

export interface AgentHealthReport {
  ready: boolean;
  mode: 'dry-run' | 'live';
  walletReady: boolean;
  executionEnabled: boolean;
  providerCount: number;
  errors: readonly string[];
}

export function buildAgentHealth(
  wallet: AgentWallet | undefined,
  providers: readonly OpportunityProviderConfig[],
  mode: 'dry-run' | 'live'
): AgentHealthReport {
  const errors: string[] = [];
  if (!wallet) errors.push('wallet is not initialized');
  if (!providers.some(provider => provider.enabled)) errors.push('no enabled opportunity providers');
  if (mode === 'live' && !wallet?.executionEnabled) errors.push('live mode requested but wallet execution is disabled');
  return {
    ready: errors.length === 0,
    mode,
    walletReady: Boolean(wallet),
    executionEnabled: Boolean(wallet?.executionEnabled),
    providerCount: providers.filter(provider => provider.enabled).length,
    errors
  };
}
