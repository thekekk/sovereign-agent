import { ToolRegistry } from './tool-registry.js';
import type { CheckpointManager } from './checkpoint.js';

export interface CheckpointedCodingDependencies {
  workspaceRoot: string;
  readFile(path: string): Promise<string>;
  search(query: string): Promise<readonly string[]>;
  writeFile(path: string, content: string): Promise<void>;
  runTests(command?: string): Promise<{ passed: boolean; output: string }>;
}

export function createCheckpointedCodingToolRegistry(
  deps: CheckpointedCodingDependencies,
  checkpoints: Pick<CheckpointManager, 'create'>
): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register({
    name: 'repo.read', description: 'Read a workspace file.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }, risk: 'read',
    execute: async (input: { path: string }) => deps.readFile(input.path)
  });
  registry.register({
    name: 'repo.search', description: 'Search workspace text.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }, risk: 'read',
    execute: async (input: { query: string }) => deps.search(input.query)
  });
  registry.register({
    name: 'repo.write', description: 'Create a checkpoint and then write a workspace file.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }, risk: 'write',
    execute: async (input: { path: string; content: string }) => {
      const checkpoint = await checkpoints.create(`before repo.write ${input.path}`);
      await deps.writeFile(input.path, input.content);
      return { written: true, path: input.path, checkpointId: checkpoint.id };
    }
  });
  registry.register({
    name: 'repo.test', description: 'Run the repository test suite.',
    inputSchema: { type: 'object', properties: { command: { type: 'string' } } }, risk: 'system',
    execute: async (input: { command?: string }) => deps.runTests(input.command)
  });
  return registry;
}
