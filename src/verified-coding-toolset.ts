import { ToolRegistry } from './tool-registry.js';
import type { ToolPolicyContext } from './tool-dispatcher.js';
import type { VerifiedCodingMutation } from './verified-coding-mutation.js';

export interface VerifiedCodingToolDependencies {
  readFile(path: string): Promise<string>;
  search(query: string): Promise<readonly string[]>;
}

/** Repository tools with writes delegated to the checkpoint/test/verification transaction. */
export function createVerifiedCodingToolRegistry(
  deps: VerifiedCodingToolDependencies,
  mutation: Pick<VerifiedCodingMutation, 'execute'>
): ToolRegistry {
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
    description: 'Checkpoint, mutate, test and verify a repository file.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, testCommand: { type: 'string' } }, required: ['path', 'content'] },
    risk: 'write',
    execute: async (input: { path: string; content: string; testCommand?: string }) => mutation.execute(input.path, input.content, input.testCommand)
  });
  return registry;
}

export type CodingToolPolicy = Pick<ToolPolicyContext, 'allowedRisks'>;
