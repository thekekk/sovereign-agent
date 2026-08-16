import type { ToolDefinition, ToolHandler, ToolRegistry } from './tool-registry.js';

export interface ToolPolicyContext {
  allowedRiskClasses: readonly string[];
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

/** Model requests are data; policy decides whether execution is permitted. */
export class ToolDispatcher {
  constructor(
    private readonly registry: Pick<ToolRegistry, 'get'>,
    private readonly handlers: ReadonlyMap<string, ToolHandler>
  ) {}

  async dispatch(call: ToolCall, context: ToolPolicyContext): Promise<ToolDispatchResult> {
    const definition = this.registry.get(call.name);
    if (!definition) return { ok: false, error: `unknown tool: ${call.name}` };
    if (!context.allowedRiskClasses.includes(definition.riskClass)) {
      return { ok: false, error: `tool denied by policy: ${call.name}` };
    }
    const handler = this.handlers.get(definition.name);
    if (!handler) return { ok: false, error: `no handler registered: ${call.name}` };
    if (context.dryRun) return { ok: true, output: { dryRun: true, tool: call.name } };
    try {
      return { ok: true, output: await handler(call.arguments) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'tool execution failed' };
    }
  }
}
