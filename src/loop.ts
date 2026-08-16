import type { Model } from './types.js';
import { ToolRegistry } from './tools.js';
import { Policy } from './policy.js';

export interface CodingLoopOptions { maxIterations?: number; }

export class CodingLoop {
  constructor(private readonly model: Model, private readonly tools: ToolRegistry, private readonly policy: Policy) {}

  async run(goal: string, options: CodingLoopOptions = {}): Promise<string> {
    const max = Math.min(Math.max(options.maxIterations ?? 5, 1), 20);
    const log: string[] = [];
    for (let i = 1; i <= max; i++) {
      const capabilities = this.tools.list().map(t => `${t.name} (${t.risk}): ${t.description}`).join('\n');
      const prompt = [
        'You are an autonomous software engineer operating inside a controlled workspace.',
        `Iteration ${i}/${max}.`, `Goal: ${goal}`,
        `Capabilities:\n${capabilities}`,
        `Recent results:\n${log.slice(-3).join('\n')}`,
        'Return JSON only: {"action":"inspect|edit|test|checkpoint|done","input":{}}.',
        'Prefer the smallest reversible change. Do not request financial or unrestricted host-system actions.'
      ].join('\n');
      const raw = await this.model.complete(prompt);
      log.push(`MODEL: ${raw}`);
      let plan: { action: string; input?: Record<string, unknown> };
      try { plan = JSON.parse(raw); } catch { log.push('ERROR: invalid JSON response'); continue; }
      if (plan.action === 'done') break;
      const toolName = plan.action === 'edit' ? 'workspace.edit' : plan.action === 'checkpoint' ? 'git.workflow' : 'sandbox.exec';
      const tool = this.tools.get(toolName);
      if (!tool) { log.push(`ERROR: missing tool ${toolName}`); continue; }
      const decision = this.policy.authorize(tool.risk);
      if (!decision.allowed) { log.push(`BLOCKED: ${decision.reason}`); continue; }
      const input = { ...(plan.input ?? {}) } as Record<string, unknown>;
      if (plan.action === 'test' && !input.command) { input.command = 'npm'; input.args = ['test']; }
      if (plan.action === 'inspect' && !input.command) { input.command = 'git'; input.args = ['status', '--short']; }
      if (plan.action === 'checkpoint') { input.command = 'checkpoint'; input.message ??= `agent checkpoint ${i}`; }
      try { log.push(`RESULT: ${JSON.stringify(await tool.execute(input, { taskId: `coding-${i}` }))}`); }
      catch (error) { log.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`); }
    }
    return log.join('\n');
  }
}
