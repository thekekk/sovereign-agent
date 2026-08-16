import { spawn } from 'node:child_process';
import { mkdir, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Tool, ToolContext } from './types.js';

export interface ExecInput {
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface ExecResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export class SandboxedExecutor implements Tool<ExecInput, ExecResult> {
  readonly name = 'sandbox.exec';
  readonly description = 'Run an allowlisted command inside the configured workspace with timeout and output limits.';
  readonly risk = 'system' as const;

  constructor(
    private readonly workspace = process.env.SOVEREIGN_WORKSPACE ?? './workspace',
    private readonly allowedCommands = new Set(
      (process.env.SOVEREIGN_ALLOWED_COMMANDS ?? 'node,npm,npx,git,python,python3,sh').split(',').map(x => x.trim()).filter(Boolean)
    ),
    private readonly maxOutputBytes = Number(process.env.SOVEREIGN_MAX_OUTPUT_BYTES ?? 200_000)
  ) {}

  async execute(input: ExecInput, _context: ToolContext): Promise<ExecResult> {
    if (!this.allowedCommands.has(input.command)) {
      throw new Error(`Command not allowed: ${input.command}`);
    }

    await mkdir(this.workspace, { recursive: true });
    const root = await realpath(this.workspace);
    const requested = resolve(input.cwd ? resolve(root, input.cwd) : root);
    const cwd = await realpath(requested).catch(() => { throw new Error('Invalid working directory'); });
    if (cwd !== root && !cwd.startsWith(`${root}/`)) throw new Error('Working directory escapes sandbox');

    const timeoutMs = Math.min(Math.max(input.timeoutMs ?? 30_000, 100), 300_000);
    const env = { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', ...input.env };

    return await new Promise<ExecResult>((resolvePromise, reject) => {
      const child = spawn(input.command, input.args ?? [], {
        cwd,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let finished = false;

      const append = (target: 'stdout' | 'stderr', chunk: Buffer) => {
        const text = chunk.toString('utf8');
        if (target === 'stdout') stdout += text;
        else stderr += text;
        if (Buffer.byteLength(stdout + stderr, 'utf8') > this.maxOutputBytes) child.kill('SIGKILL');
      };

      child.stdout.on('data', (chunk: Buffer) => append('stdout', chunk));
      child.stderr.on('data', (chunk: Buffer) => append('stderr', chunk));
      child.on('error', reject);

      const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
      child.on('close', (code, signal) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolvePromise({ code, signal, stdout: stdout.slice(0, this.maxOutputBytes), stderr: stderr.slice(0, this.maxOutputBytes), timedOut });
      });
    });
  }
}
