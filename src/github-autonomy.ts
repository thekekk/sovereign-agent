import type { SandboxedExecutor } from './executor.js';
import type { ToolContext } from './types.js';
import { Policy } from './policy.js';

export interface GitHubAutonomyConfig {
  workspace: string;
  branch: string;
  maxIterations: number;
}

export interface GitHubAutonomyResult {
  status: 'ready' | 'failed' | 'stopped';
  branch: string;
  iterations: number;
  testsPassed: boolean;
  diff: string;
}

/**
 * Pre-PR autonomy boundary. It validates an isolated branch/workspace and
 * produces evidence for a later GitHub PR adapter. It never merges code.
 */
export class GitHubAutonomy {
  constructor(
    private readonly executor: SandboxedExecutor,
    private readonly policy = new Policy(),
    private readonly config: GitHubAutonomyConfig = {
      workspace: process.env.SOVEREIGN_WORKSPACE ?? process.cwd(),
      branch: process.env.SOVEREIGN_BRANCH ?? 'feat/github-autonomy',
      maxIterations: Number(process.env.SOVEREIGN_WORKER_ITERATIONS ?? 3)
    }
  ) {}

  private authorize(risk: 'read' | 'write') {
    const result = this.policy.authorize(risk);
    if (!result.allowed) throw new Error(result.reason);
  }

  async inspect(context: ToolContext): Promise<string> {
    this.authorize('read');
    const result = await this.executor.execute({
      command: 'git', args: ['status', '--short', '--branch'], cwd: this.config.workspace, timeoutMs: 30_000
    }, context);
    return result.stdout;
  }

  async validate(context: ToolContext): Promise<{ passed: boolean; output: string }> {
    this.authorize('read');
    const result = await this.executor.execute({
      command: 'npm', args: ['test'], cwd: this.config.workspace, timeoutMs: 120_000
    }, context);
    return { passed: result.code === 0, output: `${result.stdout}\n${result.stderr}`.trim() };
  }

  async diff(context: ToolContext): Promise<string> {
    this.authorize('read');
    const result = await this.executor.execute({
      command: 'git', args: ['diff', '--stat'], cwd: this.config.workspace, timeoutMs: 30_000
    }, context);
    return result.stdout;
  }

  async run(context: ToolContext): Promise<GitHubAutonomyResult> {
    const branch = await this.inspect(context);
    const validation = await this.validate(context);
    const diff = await this.diff(context);
    return {
      status: validation.passed ? 'ready' : 'failed',
      branch: branch.trim(),
      iterations: 1,
      testsPassed: validation.passed,
      diff: diff.trim()
    };
  }
}
