import { randomBytes } from 'node:crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { WalletVault, type EncryptedSecret } from './wallet-vault.js';

export interface AgentWallet {
  id: string;
  chain: 'evm';
  createdAt: string;
  address: string;
  encryptedPrivateKey: EncryptedSecret;
  executionEnabled: boolean;
}

export interface WalletFactoryResult {
  wallet: AgentWallet;
  privateKey: string;
}

const evmAddress = (privateKey: Uint8Array): string => {
  const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
  return `0x${Buffer.from(keccak_256(publicKey).slice(-20)).toString('hex')}`;
};

export class WalletFactory {
  constructor(private readonly vault: WalletVault) {}

  createEvmWallet(): WalletFactoryResult {
    const privateKeyBytes = randomBytes(32);
    const privateKey = `0x${privateKeyBytes.toString('hex')}`;
    const wallet: AgentWallet = {
      id: `wallet-${randomBytes(12).toString('hex')}`,
      chain: 'evm',
      createdAt: new Date().toISOString(),
      address: evmAddress(privateKeyBytes),
      encryptedPrivateKey: this.vault.encrypt(privateKey),
      executionEnabled: false
    };
    return { wallet, privateKey };
  }
}
