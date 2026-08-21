import { withRunReport, type AgentRunReport } from './agent-run-report.js';
import type { OpportunityRuntime } from './opportunity-runtime.js';
import type { WalletCapability } from './opportunity-bus.js';

export interface ContinuousRunnerOptions {
  intervalMs: number;
  maxRuns?: number;
}

export interface ContinuousRunnerHooks {
  onReport?: (report: AgentRunReport) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

export class ContinuousAgentRunner {
  constructor(
    private readonly runtime: OpportunityRuntime,
    private readonly options: ContinuousRunnerOptions,
    private readonly hooks: ContinuousRunnerHooks = {}
  ) {
    if (options.intervalMs < 0) throw new Error('intervalMs must be non-negative');
    if (options.maxRuns !== undefined && options.maxRuns < 1) throw new Error('maxRuns must be positive');
  }

  async run(wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<number> {
    let completed = 0;
    while (!signal.aborted && (this.options.maxRuns === undefined || completed < this.options.maxRuns)) {
      try {
        const report = await withRunReport(() => this.runtime.run(wallet, signal));
        await this.hooks.onReport?.(report);
      } catch (error) {
        await this.hooks.onError?.(error);
      }
      completed += 1;
      if (!signal.aborted && (this.options.maxRuns === undefined || completed < this.options.maxRuns) && this.options.intervalMs > 0) {
        await new Promise<void>(resolve => {
          const timer = setTimeout(resolve, this.options.intervalMs);
          signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
        });
      }
    }
    return completed;
  }
}
