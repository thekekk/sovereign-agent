import { spawn } from 'node:child_process';
import { Workspace } from './workspace.js';

export interface GitResult { code: number; stdout: string; stderr: string; }

export class GitWorkspace {
  constructor(private readonly workspace: Workspace) {}

  private async git(args: string[], timeoutMs = 30_000): Promise<GitResult> {
    await this.workspace.init();
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, { cwd: this.workspace.root, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.on('data', d => { stdout += d.toString(); });
      child.stderr.on('data', d => { stderr += d.toString(); });
      const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('git command timed out')); }, timeoutMs);
      child.on('error', reject);
      child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, stdout, stderr }); });
    });
  }

  async init(): Promise<GitResult> { return this.git(['init']); }
  async status(): Promise<GitResult> { return this.git(['status', '--short']); }
  async diff(): Promise<GitResult> { return this.git(['diff', '--']); }
  async checkpoint(message: string): Promise<GitResult> {
    const safe = message.trim().slice(0, 120) || 'sovereign checkpoint';
    const add = await this.git(['add', '--all']);
    if (add.code !== 0) return add;
    return this.git(['commit', '-m', safe]);
  }
  async rollback(commit = 'HEAD~1'): Promise<GitResult> { return this.git(['reset', '--hard', commit]); }
}
