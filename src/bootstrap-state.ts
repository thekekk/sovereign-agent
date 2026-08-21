import type { AgentWallet, WalletFactory } from './wallet-factory.js';
import { WalletStateStore } from './wallet-state-store.js';

export interface BootstrapWalletResult { wallet: AgentWallet; created: boolean; }

export class BootstrapState {
  constructor(private readonly factory: WalletFactory, private readonly store: WalletStateStore) {}

  async getOrCreate(): Promise<BootstrapWalletResult> {
    const existing = await this.store.load();
    if (existing) return { wallet: existing, created: false };
    const created = this.factory.createEvmWallet().wallet;
    await this.store.save(created);
    return { wallet: created, created: true };
  }
}
