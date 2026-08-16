import { randomBytes, randomUUID } from 'node:crypto';

export interface SovereignIdentity {
  id: string;
  publicKey: string;
  chain?: string;
  address?: string;
  createdAt: string;
}

export class IdentityManager {
  private identity?: SovereignIdentity;

  create(): SovereignIdentity {
    if (this.identity) return this.identity;
    const seed = randomBytes(32).toString('hex');
    const publicKey = randomBytes(32).toString('hex');
    this.identity = { id: randomUUID(), publicKey: `${publicKey}:${seed.slice(0, 8)}`, createdAt: new Date().toISOString() };
    return this.identity;
  }

  current(): SovereignIdentity | undefined { return this.identity; }
}
