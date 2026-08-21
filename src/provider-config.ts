export interface ProviderConfig {
  id: string;
  domain: string;
  service: string;
  baseUrl: string;
  enabled?: boolean;
  capabilities?: readonly string[];
}

export function loadProviderConfigs(env: Record<string, string | undefined> = process.env): readonly ProviderConfig[] {
  const raw = env.SOVEREIGN_PROVIDERS?.trim();
  if (!raw) return [];
  return raw.split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
    const [id, domain, service, baseUrl] = entry.split('|').map(value => value.trim());
    if (!id || !domain || !service || !baseUrl) throw new Error('invalid provider configuration entry');
    return { id, domain, service, baseUrl, enabled: true };
  });
}
