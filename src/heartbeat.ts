export type TickHandler = () => Promise<void>;

export class Heartbeat {
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly intervalMs = Number(process.env.SOVEREIGN_HEARTBEAT_MS ?? 60_000)) {}

  start(handler: TickHandler): void {
    if (this.timer) return;
    const run = async () => {
      try { await handler(); } catch (error) { console.error('[heartbeat]', error); }
    };
    this.timer = setInterval(run, Math.max(1_000, this.intervalMs));
    void run();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
