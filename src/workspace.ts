import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';

export class Workspace {
  readonly root: string;

  constructor(root = process.env.SOVEREIGN_WORKSPACE ?? '.sovereign/workspace') {
    this.root = resolve(root);
  }

  async init(): Promise<void> { await mkdir(this.root, { recursive: true }); }

  resolvePath(path: string): string {
    const target = resolve(this.root, path);
    const rel = relative(this.root, target);
    if (isAbsolute(rel) || rel.startsWith('..' + require('node:path').sep) || rel === '..') {
      throw new Error(`Path escapes workspace: ${path}`);
    }
    return target;
  }

  async read(path: string): Promise<string> { return readFile(this.resolvePath(path), 'utf8'); }
  async write(path: string, content: string): Promise<void> {
    const target = this.resolvePath(path);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
}
