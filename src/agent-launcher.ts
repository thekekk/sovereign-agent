import { loadRuntimeConfig } from './live-runtime-config.js';
import { LiveBootstrap } from './live-bootstrap.js';
import type { WalletFactory } from './wallet-factory.js';

export interface AgentLaunchResult {
  mode: 'dry-run' | 'live';
  walletId: string;
  executionEnabled: boolean;
  maxExecutionValue: number;
  message: string;
}

export function launchAgent(factory: WalletFactory): AgentLaunchResult {
  const config = loadRuntimeConfig();
  const bootstrap = new LiveBootstrap(factory, {
    mode: config.mode,
    maxExecutionValue: config.maxExecutionValue,
    requireExplicitLiveEnable: true
  });
  const state = bootstrap.create();
  return {
    mode: state.mode,
    walletId: state.wallet.id,
    executionEnabled: state.wallet.executionEnabled,
    maxExecutionValue: state.maxExecutionValue,
    message: state.mode === 'dry-run' ? 'agent launched in dry-run mode; no live execution is permitted' : 'agent launched with configured execution ceiling'
  };
}
