import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { Tool, ToolContext } from './types.js';

export interface ReplaceFileInput {
  path: string;
  expectedContent: string;
  newContent: string;
}

export interface ReplaceFileOutput { path: string; bytes: number }

/**
 * Optimistic-concurrency file writer. The exact previous contents must match,
 * preventing a stale model proposal from silently overwriting newer work.
 */
export class WorkspaceWriter implements Tool<ReplaceFileInput, ReplaceFileOutput> {
  readonly name = 'workspace.replace';
  readonly description = 'Replace the exact contents of a UTF-8 file inside the approved workspace.';
  readonly risk = 'write' as const;

  constructor(private readonly workspace = process.env.SOVEREIGN_WORKSPACE ?? './workspace') {}

  async execute(input: ReplaceFileInput, _context: ToolContext): Promise<ReplaceFileOutput> {
    const root = resolve(this.workspace);
    const target = resolve(root, input.path);
    if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error('Path escapes workspace');
    if (input.newContent.length > 2_000_000) throw new Error('Write exceeds 2MB limit');

    let current = '';
    try {
      current = await readFile(target, 'utf8');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw error;
    }
    if (current !== input.expectedContent) throw new Error('Workspace changed since proposal; refresh before writing');

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, input.newContent, 'utf8');
    return { path: input.path, bytes: Buffer.byteLength(input.newContent, 'utf8') };
  }
}
