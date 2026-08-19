export interface RuntimeConfig {
  mode: 'dry-run' | 'live';
  maxExecutionValue: number;
  pollIntervalMs: number;
  walletId?: string;
}

const numberFromEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative number`);
  return value;
};

export const loadRuntimeConfig = (): RuntimeConfig => {
  const requestedMode = process.env.AGENT_MODE === 'live' ? 'live' : 'dry-run';
  if (requestedMode === 'live' && process.env.AGENT_LIVE_CONFIRM !== 'YES') {
    throw new Error('live mode requires AGENT_LIVE_CONFIRM=YES');
  }
  return {
    mode: requestedMode,
    maxExecutionValue: numberFromEnv('AGENT_MAX_EXECUTION_VALUE', 0),
    pollIntervalMs: numberFromEnv('AGENT_POLL_INTERVAL_MS', 30_000),
    walletId: process.env.AGENT_WALLET_ID
  };
};
