import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { Tool, ToolContext } from './types.js';

export interface ReadFileInput { path: string; maxBytes?: number }
export interface ReadFileOutput { path: string; content: string; bytes: number }

/** Read-only workspace tool. Writes remain behind an explicit write capability. */
export class WorkspaceReader implements Tool<ReadFileInput, ReadFileOutput> {
  readonly name = 'workspace.read';
  readonly description = 'Read a UTF-8 file inside the approved workspace.';
  readonly risk = 'read' as const;

  constructor(private readonly workspace = process.env.SOVEREIGN_WORKSPACE ?? './workspace') {}

  async execute(input: ReadFileInput, _context: ToolContext): Promise<ReadFileOutput> {
    const root = resolve(this.workspace);
    const target = resolve(root, input.path);
    if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error('Path escapes workspace');
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Target is not a file');
    const maxBytes = Math.min(Math.max(input.maxBytes ?? 200_000, 1), 1_000_000);
    const content = await readFile(target, { encoding: 'utf8' });
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > maxBytes) throw new Error(`File exceeds read limit (${maxBytes} bytes)`);
    return { path: input.path, content, bytes };
  }
}
