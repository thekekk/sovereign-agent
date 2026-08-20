import { BootstrapState } from './bootstrap-state.js';
import { ContinuousAgentRunner, type ContinuousRunnerHooks, type ContinuousRunnerOptions } from './continuous-agent-runner.js';
import type { OpportunityRuntime } from './opportunity-runtime.js';
import type { WalletCapability } from './opportunity-bus.js';
import type { WalletFactory } from './wallet-factory.js';
import { WalletStateStore } from './wallet-state-store.js';
import { WalletVault } from './wallet-vault.js';

export interface BootstrapRunnerOptions extends ContinuousRunnerOptions {
  vaultKey: string;
  statePath: string;
}

export class AgentBootstrapRunner {
  constructor(private readonly factory: WalletFactory, private readonly runtime: OpportunityRuntime, private readonly options: BootstrapRunnerOptions) {}

  async start(signal?: AbortSignal, hooks: ContinuousRunnerHooks = {}): Promise<number> {
    const vault = new WalletVault(this.options.vaultKey);
    const state = new BootstrapState(this.factory, new WalletStateStore(this.options.statePath, vault));
    const { wallet } = await state.getOrCreate();
    const capability = this.toCapability(wallet);
    return new ContinuousAgentRunner(this.runtime, this.options, hooks).run(capability, signal);
  }

  private toCapability(wallet: { id: string; executionEnabled: boolean }): WalletCapability {
    return {
      walletId: wallet.id,
      canExecute: wallet.executionEnabled,
      domains: ['crypto', 'xstocks', 'social-hype', 'mint', 'goods', 'collectibles', 'pokemon', 'online-service', 'other'],
      services: []
    };
  }
}
