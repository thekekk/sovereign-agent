import { WalletFactory, type AgentWallet } from './wallet-factory.js';

export interface WalletBootstrapConfig {
  enabled: boolean;
  executionEnabled: boolean;
}

export interface WalletBootstrapResult {
  wallet: AgentWallet;
  status: 'created-disabled' | 'created-ready-for-approval';
}

export function bootstrapAgentWallet(factory: WalletFactory, config: WalletBootstrapConfig): WalletBootstrapResult {
  if (!config.enabled) throw new Error('wallet bootstrap is disabled');
  const result = factory.createEvmWallet();
  const wallet = { ...result.wallet, executionEnabled: config.executionEnabled };
  return { wallet, status: config.executionEnabled ? 'created-ready-for-approval' : 'created-disabled' };
}
