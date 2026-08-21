import { ToolRegistry } from './tool-registry.js';

export interface CodingToolDependencies {
  readFile(path: string): Promise<string>;
  search(query: string): Promise<readonly string[]>;
  writeFile(path: string, content: string): Promise<void>;
  runTests(command?: string): Promise<{ passed: boolean; output: string }>;
}

/** Minimal repository toolset; mutation tools remain policy-gated by risk. */
export function createCodingToolRegistry(deps: CodingToolDependencies): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    name: 'repo.read',
    description: 'Read a repository file.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    risk: 'read',
    execute: async (input: { path: string }) => deps.readFile(input.path)
  });
  registry.register({
    name: 'repo.search',
    description: 'Search repository text.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    risk: 'read',
    execute: async (input: { query: string }) => deps.search(input.query)
  });
  registry.register({
    name: 'repo.write',
    description: 'Write a repository file.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    risk: 'write',
    execute: async (input: { path: string; content: string }) => { await deps.writeFile(input.path, input.content); return { written: true, path: input.path }; }
  });
  registry.register({
    name: 'repo.test',
    description: 'Run the repository test suite.',
    inputSchema: { type: 'object', properties: { command: { type: 'string' } } },
    risk: 'system',
    execute: async (input: { command?: string }) => deps.runTests(input.command)
  });
  return registry;
}
