import type { Tool, ToolContext } from './types.js';
import { GitWorkspace } from './git-workspace.js';

export class GitStatusTool implements Tool<{}, string> {
  readonly name = 'git.status';
  readonly description = 'Inspect workspace Git status without modifying files.';
  readonly risk = 'read' as const;
  constructor(private readonly git: GitWorkspace) {}

  async execute(_input: {}, _context: ToolContext): Promise<string> {
    const result = await this.git.status();
    if (result.code !== 0) throw new Error(result.stderr || 'git status failed');
    return result.stdout || 'clean';
  }
}

export class GitDiffTool implements Tool<{}, string> {
  readonly name = 'git.diff';
  readonly description = 'Inspect current workspace changes without modifying files.';
  readonly risk = 'read' as const;
  constructor(private readonly git: GitWorkspace) {}

  async execute(_input: {}, _context: ToolContext): Promise<string> {
    const result = await this.git.diff();
    if (result.code !== 0) throw new Error(result.stderr || 'git diff failed');
    return result.stdout;
  }
}
