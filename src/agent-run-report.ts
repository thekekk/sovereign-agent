import type { OpportunityRuntimeResult } from './opportunity-runtime.js';

export interface AgentRunReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result: OpportunityRuntimeResult;
}

export async function withRunReport<T extends OpportunityRuntimeResult>(run: () => Promise<T>): Promise<AgentRunReport> {
  const started = Date.now();
  const result = await run();
  const finished = Date.now();
  return {
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - started,
    result
  };
}
