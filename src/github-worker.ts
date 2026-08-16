import type { ToolContext } from './types.js';
import type { SandboxedExecutor } from './executor.js';
import { Policy } from './policy.js';

export interface GitHubWorkerConfig {
  workspace: string;
  maxIterations: number;
  testCommand: string;
  testArgs: string[];
}

export interface GitHubWorkerResult {
  status: 'completed' | 'failed' | 'stopped';
  iterations: number;
  testsPassed: boolean;
  summary: string;
}

/**
 * Controlled repository worker. It deliberately operates on a pre-approved
 * workspace; GitHub/network writes remain separate capabilities.
 */
export class GitHubWorker {
  constructor(
    private readonly executor: SandboxedExecutor,
    private readonly policy = new Policy(),
    private readonly config: GitHubWorkerConfig = {
      workspace: process.env.SOVEREIGN_WORKSPACE ?? process.cwd(),
      maxIterations: Number(process.env.SOVEREIGN_WORKER_ITERATIONS ?? 3),
      testCommand: process.env.SOVEREIGN_TEST_COMMAND ?? 'npm',
      testArgs: (process.env.SOVEREIGN_TEST_ARGS ?? 'test').split(' ').filter(Boolean)
    }
  ) {}

  async inspect(context: ToolContext): Promise<string> {
    const auth = this.policy.authorize('read');
    if (!auth.allowed) throw new Error(auth.reason);
    const result = await this.executor.execute(
      { command: 'git', args: ['status', '--short'], cwd: this.config.workspace, timeoutMs: 30_000 },
      context
    );
    return result.stdout;
  }

  async test(context: ToolContext): Promise<{ passed: boolean; output: string }> {
    const auth = this.policy.authorize('read');
    if (!auth.allowed) throw new Error(auth.reason);
    const result = await this.executor.execute(
      { command: this.config.testCommand, args: this.config.testArgs, cwd: this.config.workspace, timeoutMs: 120_000 },
      context
    );
    return { passed: result.code === 0, output: `${result.stdout}\n${result.stderr}`.trim() };
  }

  async run(context: ToolContext): Promise<GitHubWorkerResult> {
    const inspection = await this.inspect(context);
    if (!inspection && this.config.maxIterations <= 0) {
      return { status: 'stopped', iterations: 0, testsPassed: false, summary: 'No work budget available' };
    }

    const result = await this.test(context);
    return {
      status: result.passed ? 'completed' : 'failed',
      iterations: 1,
      testsPassed: result.passed,
      summary: result.passed ? 'Workspace inspection and validation passed' : `Validation failed: ${result.output.slice(0, 2000)}`
    };
  }
}
