export interface OpportunitySchedulerOptions {
  intervalMs: number;
  maxCycles?: number;
  backoffMultiplier?: number;
  maxIntervalMs?: number;
}

export interface OpportunitySchedulerHooks {
  cycle(signal: AbortSignal): Promise<{ success: boolean }>;
}

export class OpportunityScheduler {
  private cycles = 0;
  private stopped = false;
  private intervalMs: number;

  constructor(private readonly options: OpportunitySchedulerOptions, private readonly hooks: OpportunitySchedulerHooks) {
    if (options.intervalMs <= 0) throw new Error('intervalMs must be positive');
    this.intervalMs = options.intervalMs;
  }

  stop(): void { this.stopped = true; }
  get cycleCount(): number { return this.cycles; }

  async run(signal: AbortSignal = new AbortController().signal): Promise<void> {
    while (!this.stopped && !signal.aborted && (this.options.maxCycles === undefined || this.cycles < this.options.maxCycles)) {
      const result = await this.hooks.cycle(signal);
      this.cycles += 1;
      if (!result.success) {
        this.intervalMs = Math.min(this.options.maxIntervalMs ?? this.intervalMs * 16, Math.ceil(this.intervalMs * (this.options.backoffMultiplier ?? 2)));
      } else {
        this.intervalMs = this.options.intervalMs;
      }
      if (!this.stopped && !signal.aborted && (this.options.maxCycles === undefined || this.cycles < this.options.maxCycles)) {
        await new Promise<void>(resolve => setTimeout(resolve, this.intervalMs));
      }
    }
  }
}
