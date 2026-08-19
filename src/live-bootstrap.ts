import type { WalletFactory, AgentWallet } from './wallet-factory.js';

export interface LiveBootstrapConfig {
  mode: 'dry-run' | 'live';
  maxExecutionValue: number;
  requireExplicitLiveEnable: boolean;
}

export interface LiveBootstrapState {
  wallet: AgentWallet;
  mode: 'dry-run' | 'live';
  maxExecutionValue: number;
}

export class LiveBootstrap {
  constructor(private readonly factory: WalletFactory, private readonly config: LiveBootstrapConfig) {
    if (config.maxExecutionValue < 0) throw new Error('maxExecutionValue must be non-negative');
    if (config.mode === 'live' && config.requireExplicitLiveEnable) {
      throw new Error('live mode requires explicit runtime enablement');
    }
  }

  create(): LiveBootstrapState {
    const { wallet } = this.factory.createEvmWallet();
    return {
      wallet,
      mode: this.config.mode,
      maxExecutionValue: this.config.maxExecutionValue
    };
  }
}
