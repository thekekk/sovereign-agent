import { resolve, relative, isAbsolute, sep } from 'node:path';
import { ToolRegistry } from './tool-registry.js';

export interface SandboxedCodingDependencies {
  workspaceRoot: string;
  readFile(path: string): Promise<string>;
  search(query: string): Promise<readonly string[]>;
  writeFile(path: string, content: string): Promise<void>;
  runTests(command?: string): Promise<{ passed: boolean; output: string }>;
}

function safePath(root: string, candidate: string): string {
  if (isAbsolute(candidate)) throw new Error('absolute paths are not permitted');
  const resolvedRoot = resolve(root);
  const resolved = resolve(resolvedRoot, candidate);
  const rel = relative(resolvedRoot, resolved);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('path escapes workspace');
  return resolved;
}

/** Coding toolset whose file operations cannot escape the configured workspace. */
export function createSandboxedCodingToolRegistry(deps: SandboxedCodingDependencies): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    name: 'repo.read',
    description: 'Read a file inside the configured workspace.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    risk: 'read',
    execute: async (input: { path: string }) => deps.readFile(safePath(deps.workspaceRoot, input.path))
  });
  registry.register({
    name: 'repo.search',
    description: 'Search text inside the configured workspace.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    risk: 'read',
    execute: async (input: { query: string }) => deps.search(input.query)
  });
  registry.register({
    name: 'repo.write',
    description: 'Write a file inside the configured workspace.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    risk: 'write',
    execute: async (input: { path: string; content: string }) => {
      const path = safePath(deps.workspaceRoot, input.path);
      await deps.writeFile(path, input.content);
      return { written: true, path };
    }
  });
  registry.register({
    name: 'repo.test',
    description: 'Run the configured repository test command.',
    inputSchema: { type: 'object', properties: { command: { type: 'string' } } },
    risk: 'system',
    execute: async (input: { command?: string }) => deps.runTests(input.command)
  });
  return registry;
}
