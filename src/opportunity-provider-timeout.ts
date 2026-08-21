import type { Opportunity } from './opportunity-bus.js';
import type { OpportunityProvider } from './opportunity-provider-registry.js';

export class TimedOpportunityProvider implements OpportunityProvider {
  constructor(readonly id: string, private readonly provider: OpportunityProvider, private readonly timeoutMs: number) {
    if (timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  }

  async discover(signal: AbortSignal): Promise<readonly Opportunity[]> {
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('provider timeout')), this.timeoutMs);
    try {
      return await this.provider.discover(controller.signal);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }
  }
}
