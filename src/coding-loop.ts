import type { Model } from './types.js';
import type { SandboxedExecutor, ExecResult } from './executor.js';

export interface CodingLoopConfig {
  maxIterations: number;
  testCommand: string;
  testArgs: string[];
}

export interface CodingIteration {
  iteration: number;
  proposal: string;
  test: ExecResult;
}

export class CodingLoop {
  constructor(
    private readonly model: Model,
    private readonly executor: SandboxedExecutor,
    private readonly config: CodingLoopConfig = {
      maxIterations: Number(process.env.SOVEREIGN_MAX_ITERATIONS ?? 5),
      testCommand: process.env.SOVEREIGN_TEST_COMMAND ?? 'npm',
      testArgs: (process.env.SOVEREIGN_TEST_ARGS ?? 'test').split(' ').filter(Boolean)
    }
  ) {}

  async run(goal: string): Promise<CodingIteration[]> {
    const results: CodingIteration[] = [];
    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      const proposal = await this.model.complete([
        'You are a coding agent operating inside a controlled workspace.',
        'Do not claim files were changed unless a tool actually changed them.',
        `Goal: ${goal}`,
        `Iteration: ${iteration}/${this.config.maxIterations}`,
        results.length ? `Previous test result:\n${JSON.stringify(results.at(-1)?.test)}` : 'No tests have run yet.',
        'Return the next implementation step.'
      ].join('\n'));
      const test = await this.executor.execute({ command: this.config.testCommand, args: this.config.testArgs, timeoutMs: 120_000 }, { taskId: `coding-${Date.now()}-${iteration}` });
      results.push({ iteration, proposal, test });
      if (test.code === 0) break;
    }
    return results;
  }
}
