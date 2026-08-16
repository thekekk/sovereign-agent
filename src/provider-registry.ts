import type { Model } from './types.js';

export interface ProviderDescriptor {
  id: string;
  models: string[];
  capabilities: Array<'chat' | 'code' | 'vision' | 'tools' | 'streaming'>;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, { descriptor: ProviderDescriptor; factory: (model?: string) => Model }>();

  register(descriptor: ProviderDescriptor, factory: (model?: string) => Model): void {
    this.providers.set(descriptor.id, { descriptor, factory });
  }

  list(): ProviderDescriptor[] { return [...this.providers.values()].map(x => x.descriptor); }
  create(providerId: string, model?: string): Model {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);
    return provider.factory(model);
  }
}
