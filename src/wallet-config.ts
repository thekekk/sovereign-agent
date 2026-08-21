import type { Opportunity, WalletCapability } from './opportunity-bus.js';

export interface WalletConfig {
  walletId: string;
  canExecute?: boolean;
  domains: readonly Opportunity['domain'][];
  services: readonly string[];
}

export function createWalletCapability(config: WalletConfig): WalletCapability {
  return {
    walletId: config.walletId,
    canExecute: config.canExecute === true,
    domains: [...config.domains],
    services: [...config.services],
  };
}

export function loadWalletConfigs(env: Record<string, string | undefined> = process.env): WalletCapability[] {
  const walletId = env.SOVEREIGN_WALLET_ID?.trim();
  if (!walletId) return [];
  const domains = (env.SOVEREIGN_WALLET_DOMAINS ?? 'crypto').split(',').map(v => v.trim()).filter(Boolean) as Opportunity['domain'][];
  const services = (env.SOVEREIGN_WALLET_SERVICES ?? '').split(',').map(v => v.trim()).filter(Boolean);
  return [createWalletCapability({ walletId, canExecute: env.SOVEREIGN_WALLET_EXECUTE === 'true', domains, services })];
}
