import type { AgentWallet } from './wallet-factory.js';
import { WalletVault } from './wallet-vault.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface PersistedWalletState { wallet: AgentWallet; }

export class WalletStateStore {
  constructor(private readonly path: string, private readonly vault: WalletVault) {}

  async save(wallet: AgentWallet): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const payload: PersistedWalletState = { wallet };
    await writeFile(this.path, JSON.stringify(payload), { mode: 0o600 });
  }

  async load(): Promise<AgentWallet | undefined> {
    try {
      const raw = await readFile(this.path, 'utf8');
      const parsed = JSON.parse(raw) as PersistedWalletState;
      if (!parsed.wallet?.id || !parsed.wallet.encryptedPrivateKey) throw new Error('invalid persisted wallet state');
      return parsed.wallet;
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (code === 'ENOENT') return undefined;
      throw error;
    }
  }

  restorePrivateKey(wallet: AgentWallet): string { return this.vault.decrypt(wallet.encryptedPrivateKey); }
}
