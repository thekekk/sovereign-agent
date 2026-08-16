import { randomUUID } from 'node:crypto';
import type { Model, Task } from './types.js';
import { Memory } from './memory.js';
import { ToolRegistry } from './tools.js';
import { Policy } from './policy.js';

export class Agent {
  constructor(
    private readonly model: Model,
    private readonly memory = new Memory(),
    private readonly tools = new ToolRegistry(),
    private readonly policy = new Policy()
  ) {}

  async run(goal: string): Promise<{ task: Task; output: string }> {
    const now = new Date().toISOString();
    const task: Task = { id: randomUUID(), goal, status: 'running', createdAt: now, updatedAt: now };
    this.memory.set(`task:${task.id}`, task);

    const toolSummary = this.tools.list()
      .map(t => `- ${t.name}: ${t.description} [risk=${t.risk}]`)
      .join('\n') || '(no tools registered)';

    const prompt = [
      'You are the planning core of Sovereign Agent.',
      'Solve the user goal methodically. Do not claim an action happened unless a tool actually executed it.',
      'Available tools:', toolSummary,
      '', `Goal: ${goal}`,
      '', 'Return a concise plan and the next safe action. If an action requires a risk not permitted by policy, explain the required approval.'
    ].join('\n');

    try {
      const output = await this.model.complete(prompt);
      task.status = 'completed';
      task.updatedAt = new Date().toISOString();
      this.memory.set(`task:${task.id}`, task);
      this.memory.set(`result:${task.id}`, output);
      return { task, output };
    } catch (error) {
      task.status = 'failed';
      task.updatedAt = new Date().toISOString();
      this.memory.set(`task:${task.id}`, task);
      throw error;
    }
  }

  get policy(): Policy { return this.policy; }
  get memoryStore(): Memory { return this.memory; }
  get toolRegistry(): ToolRegistry { return this.tools; }
}
