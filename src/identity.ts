import { createHash, randomBytes, randomUUID } from 'node:crypto';

export interface SovereignIdentity {
  id: string;
  publicKeyFingerprint: string;
  chain?: string;
  address?: string;
  createdAt: string;
}

/** Provider-neutral identity metadata. It deliberately does not expose private key material. */
export class IdentityManager {
  private identity?: SovereignIdentity;

  create(): SovereignIdentity {
    if (this.identity) return this.identity;
    const keyMaterial = randomBytes(32);
    const fingerprint = createHash('sha256').update(keyMaterial).digest('hex');
    this.identity = {
      id: randomUUID(),
      publicKeyFingerprint: fingerprint,
      createdAt: new Date().toISOString()
    };
    keyMaterial.fill(0);
    return this.identity;
  }

  current(): SovereignIdentity | undefined { return this.identity; }
}
