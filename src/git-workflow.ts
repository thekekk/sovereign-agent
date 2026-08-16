import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool, ToolContext } from './types.js';

const exec = promisify(execFile);

export interface GitInput { command: 'status' | 'diff' | 'checkpoint' | 'rollback'; message?: string; ref?: string; }
export interface GitResult { output: string; checkpoint?: string; }

export class GitWorkflow implements Tool<GitInput, GitResult> {
  readonly name = 'git.workflow';
  readonly description = 'Inspect a repository, create a checkpoint commit, or rollback to a known ref.';
  readonly risk = 'write' as const;

  constructor(private readonly cwd = process.env.SOVEREIGN_WORKSPACE ?? '.sovereign/workspace') {}

  private async run(args: string[]): Promise<string> {
    const { stdout, stderr } = await exec('git', args, { cwd, maxBuffer: 500_000 });
    return `${stdout}${stderr}`.trim();
  }

  async execute(input: GitInput, _context: ToolContext): Promise<GitResult> {
    switch (input.command) {
      case 'status': return { output: await this.run(['status', '--short']) };
      case 'diff': return { output: await this.run(['diff', '--no-ext-diff', '--'] ) };
      case 'checkpoint': {
        const message = input.message?.trim() || 'agent checkpoint';
        await this.run(['add', '--all']);
        const status = await this.run(['status', '--porcelain']);
        if (!status) return { output: 'No changes to checkpoint' };
        await this.run(['commit', '-m', message]);
        return { output: await this.run(['log', '-1', '--oneline']), checkpoint: await this.run(['rev-parse', 'HEAD']) };
      }
      case 'rollback': {
        const ref = input.ref?.trim();
        if (!ref || !/^[0-9a-f]{7,40}$/i.test(ref)) throw new Error('Rollback requires a commit SHA');
        return { output: await this.run(['reset', '--hard', ref]) };
      }
    }
  }
}
