import { resolveRuntimeMode, type RuntimeMode } from './runtime-mode.js';

export interface RuntimeConfig {
  mode: RuntimeMode;
  providerUrls: readonly string[];
  liveExecutionEnabled: boolean;
}

function parseUrls(value: string | undefined): readonly string[] {
  if (!value?.trim()) return [];
  return value.split(',').map(value => value.trim()).filter(Boolean);
}

export function loadRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig {
  const mode = resolveRuntimeMode({
    mode: env.SOVEREIGN_MODE === 'live' ? 'live' : 'sandbox',
    liveExecutionEnabled: env.SOVEREIGN_LIVE_EXECUTION === 'true'
  });
  const providerUrls = parseUrls(env.SOVEREIGN_PROVIDER_URLS);
  if (mode === 'live' && providerUrls.length === 0) {
    throw new Error('live mode requires at least one configured provider URL');
  }
  return {
    mode,
    providerUrls,
    liveExecutionEnabled: mode === 'live'
  };
}
