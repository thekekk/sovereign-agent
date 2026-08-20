export type RuntimeMode = 'sandbox' | 'live';

export interface RuntimeModeConfig {
  mode?: RuntimeMode;
  liveExecutionEnabled?: boolean;
}

export function resolveRuntimeMode(config: RuntimeModeConfig = {}): RuntimeMode {
  if (config.mode === 'live' && config.liveExecutionEnabled === true) return 'live';
  return 'sandbox';
}

export function assertLiveExecutionEnabled(config: RuntimeModeConfig): void {
  if (resolveRuntimeMode(config) !== 'live') {
    throw new Error('live execution is not explicitly enabled');
  }
}
