import type { OpportunityDomain, WalletCapability } from './opportunity-bus.js';

export interface WalletCapabilityConfig {
  walletId: string;
  canExecute: boolean;
  domains: readonly OpportunityDomain[];
  services: readonly string[];
}

export function buildWalletCapability(config: WalletCapabilityConfig): WalletCapability {
  if (!config.walletId.trim()) throw new Error('walletId is required');
  return {
    walletId: config.walletId,
    canExecute: config.canExecute,
    domains: [...new Set(config.domains)],
    services: [...new Set(config.services)]
  };
}

const listFromEnv = (value: string | undefined): string[] =>
  value?.split(',').map(item => item.trim()).filter(Boolean) ?? [];

export function loadWalletCapabilityConfig(env: NodeJS.ProcessEnv = process.env): WalletCapabilityConfig {
  const walletId = env.AGENT_WALLET_ID ?? '';
  const domains = listFromEnv(env.AGENT_WALLET_DOMAINS) as OpportunityDomain[];
  const services = listFromEnv(env.AGENT_WALLET_SERVICES);
  return {
    walletId,
    canExecute: env.AGENT_EXECUTION_ENABLED === 'YES',
    domains,
    services
  };
}
