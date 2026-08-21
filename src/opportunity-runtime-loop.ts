import type { WalletCapability } from './opportunity-bus.js';
import { OpportunityRuntime } from './opportunity-runtime.js';

export interface RuntimeLoopOptions {
  maxCycles: number;
  pauseMs: number;
}

export class OpportunityRuntimeLoop {
  constructor(private readonly runtime: OpportunityRuntime, private readonly options: RuntimeLoopOptions) {
    if (options.maxCycles < 1 || options.pauseMs < 0) throw new Error('invalid runtime loop options');
  }

  async run(wallet: WalletCapability, signal: AbortSignal = new AbortController().signal): Promise<number> {
    let completed = 0;
    while (!signal.aborted && completed < this.options.maxCycles) {
      await this.runtime.run(wallet, signal);
      completed += 1;
      if (completed < this.options.maxCycles && this.options.pauseMs > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, this.options.pauseMs));
      }
    }
    return completed;
  }
}
