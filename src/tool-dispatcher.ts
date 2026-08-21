import type { ToolDefinition, ToolRegistry, ToolContext } from './tool-registry.js';

export interface ToolPolicyContext {
  allowedRisks: readonly ToolDefinition['risk'][];
  dryRun?: boolean;
}

export interface ToolCall {
  name: string;
  arguments: unknown;
}

export interface ToolDispatchResult {
  ok: boolean;
  output?: unknown;
  error?: string;
}

/** Model requests are data; policy decides whether the registered capability executes. */
export class ToolDispatcher {
  constructor(private readonly registry: Pick<ToolRegistry, 'get'>) {}

  async dispatch(call: ToolCall, context: ToolPolicyContext, toolContext: ToolContext): Promise<ToolDispatchResult> {
    const definition = this.registry.get(call.name);
    if (!definition) return { ok: false, error: `unknown tool: ${call.name}` };
    if (!context.allowedRisks.includes(definition.risk)) {
      return { ok: false, error: `tool denied by policy: ${call.name}` };
    }
    if (context.dryRun) return { ok: true, output: { dryRun: true, tool: call.name } };
    try {
      return { ok: true, output: await definition.execute(call.arguments, toolContext) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'tool execution failed' };
    }
  }
}
