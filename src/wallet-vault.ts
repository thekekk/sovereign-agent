import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface EncryptedSecret {
  algorithm: 'aes-256-gcm';
  iv: string;
  tag: string;
  ciphertext: string;
}

export class WalletVault {
  private readonly key: Buffer;

  constructor(masterKeyHex: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(masterKeyHex)) throw new Error('WALLET_VAULT_KEY must be exactly 32 bytes encoded as 64 hex characters');
    this.key = Buffer.from(masterKeyHex, 'hex');
  }

  encrypt(secret: string): EncryptedSecret {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return { algorithm: 'aes-256-gcm', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
  }

  decrypt(value: EncryptedSecret): string {
    if (value.algorithm !== 'aes-256-gcm') throw new Error('unsupported wallet secret encryption algorithm');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(value.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  }
}
