import type { Tool } from './types.js';

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined { return this.tools.get(name); }
  list(): Tool[] { return [...this.tools.values()]; }
}
