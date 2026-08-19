import { randomBytes } from 'node:crypto';
import { WalletVault, type EncryptedSecret } from './wallet-vault.js';

export interface AgentWallet {
  id: string;
  chain: 'evm';
  createdAt: string;
  publicIdentifier: string;
  encryptedPrivateKey: EncryptedSecret;
  executionEnabled: boolean;
}

export interface WalletFactoryResult {
  wallet: AgentWallet;
  privateKey: string;
}

export class WalletFactory {
  constructor(private readonly vault: WalletVault) {}

  createEvmWallet(): WalletFactoryResult {
    const privateKey = `0x${randomBytes(32).toString('hex')}`;
    const id = `wallet-${randomBytes(12).toString('hex')}`;
    const encryptedPrivateKey = this.vault.encrypt(privateKey);
    return {
      wallet: {
        id,
        chain: 'evm',
        createdAt: new Date().toISOString(),
        publicIdentifier: id,
        encryptedPrivateKey,
        executionEnabled: false
      },
      privateKey
    };
  }
}
