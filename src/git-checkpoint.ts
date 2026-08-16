import type { SandboxedExecutor } from './executor.js';
import type { ToolContext } from './types.js';
import { Policy } from './policy.js';

export interface GitCheckpoint {
  commit: string;
  label: string;
  createdAt: string;
}

export interface RollbackResult {
  ok: boolean;
  commit: string;
  output: string;
}

/**
 * Safe checkpoint boundary for an approved workspace. It never force-pushes,
 * deletes remote history, or changes branches outside the configured workspace.
 */
export class GitCheckpointController {
  constructor(
    private readonly executor: SandboxedExecutor,
    private readonly policy = new Policy(),
    private readonly workspace = process.env.SOVEREIGN_WORKSPACE ?? process.cwd()
  ) {}

  private authorize(risk: 'read' | 'write') {
    const result = this.policy.authorize(risk);
    if (!result.allowed) throw new Error(result.reason);
  }

  async checkpoint(label: string, context: ToolContext): Promise<GitCheckpoint> {
    this.authorize('write');
    if (!label.trim()) throw new Error('checkpoint label is required');

    const status = await this.executor.execute({
      command: 'git', args: ['status', '--porcelain'], cwd: this.workspace, timeoutMs: 30_000
    }, context);
    if (status.code !== 0) throw new Error(status.stderr || 'Unable to inspect git status');

    if (status.stdout.trim()) {
      const add = await this.executor.execute({
        command: 'git', args: ['add', '--all'], cwd: this.workspace, timeoutMs: 30_000
      }, context);
      if (add.code !== 0) throw new Error(add.stderr || 'Unable to stage workspace');

      const commit = await this.executor.execute({
        command: 'git', args: ['commit', '-m', label], cwd: this.workspace, timeoutMs: 60_000
      }, context);
      if (commit.code !== 0) throw new Error(commit.stderr || 'Unable to create checkpoint');
    }

    const head = await this.executor.execute({
      command: 'git', args: ['rev-parse', 'HEAD'], cwd: this.workspace, timeoutMs: 30_000
    }, context);
    if (head.code !== 0) throw new Error(head.stderr || 'Unable to resolve checkpoint');

    return { commit: head.stdout.trim(), label, createdAt: new Date().toISOString() };
  }

  async rollback(checkpoint: GitCheckpoint, context: ToolContext): Promise<RollbackResult> {
    this.authorize('write');
    if (!/^[0-9a-f]{40}$/.test(checkpoint.commit)) throw new Error('Invalid checkpoint commit');

    const verify = await this.executor.execute({
      command: 'git', args: ['cat-file', '-e', `${checkpoint.commit}^{commit}`], cwd: this.workspace, timeoutMs: 30_000
    }, context);
    if (verify.code !== 0) throw new Error('Checkpoint is not present in the local repository');

    const result = await this.executor.execute({
      command: 'git', args: ['reset', '--hard', checkpoint.commit], cwd: this.workspace, timeoutMs: 60_000
    }, context);
    return { ok: result.code === 0, commit: checkpoint.commit, output: `${result.stdout}\n${result.stderr}`.trim() };
  }
}
