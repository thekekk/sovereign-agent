import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import type { Tool, ToolContext } from './types.js';

export interface EditInput {
  path: string;
  expected: string;
  replacement: string;
}

export interface EditResult { path: string; changed: boolean; bytes: number; }

export class FileEditor implements Tool<EditInput, EditResult> {
  readonly name = 'workspace.edit';
  readonly description = 'Apply an exact text replacement to a file inside the configured workspace.';
  readonly risk = 'write' as const;

  constructor(private readonly root = resolve(process.env.SOVEREIGN_WORKSPACE ?? '.sovereign/workspace')) {}

  private safe(path: string): string {
    const target = resolve(this.root, path);
    const rel = relative(this.root, target);
    if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${path.includes('\\') ? '\\' : '/'}`)) {
      throw new Error(`Path escapes workspace: ${path}`);
    }
    return target;
  }

  async execute(input: EditInput, _context: ToolContext): Promise<EditResult> {
    if (input.expected.length === 0) throw new Error('Expected text must not be empty');
    const target = this.safe(input.path);
    const current = await readFile(target, 'utf8');
    if (!current.includes(input.expected)) throw new Error(`Expected text not found in ${input.path}`);
    const occurrences = current.split(input.expected).length - 1;
    if (occurrences !== 1) throw new Error(`Expected text occurs ${occurrences} times; refusing ambiguous edit`);
    const next = current.replace(input.expected, input.replacement);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, next, 'utf8');
    return { path: input.path, changed: next !== current, bytes: Buffer.byteLength(next) };
  }
}
