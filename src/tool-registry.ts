export interface ToolContext {
  taskId: string;
  signal?: AbortSignal;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: object;
  risk: 'read' | 'write' | 'system' | 'network';
  execute(input: TInput, context: ToolContext): Promise<TOutput>;
}

/** Model-facing registry. Registration is explicit; policy remains outside the model. */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    if (!/^[a-z][a-z0-9_.-]{1,63}$/.test(tool.name)) throw new Error('invalid tool name');
    if (this.tools.has(tool.name)) throw new Error(`tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool as ToolDefinition);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): readonly ToolDefinition[] {
    return [...this.tools.values()];
  }
}
