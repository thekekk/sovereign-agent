import type { Model } from './types.js';
import { ToolRegistry } from './tools.js';
import { Policy } from './policy.js';
import { GitWorkspace } from './git-workspace.js';
import type { Workspace } from './workspace.js';

export interface CodingIteration {
  plan: string;
  result: string;
  checkpoint?: string;
}

export class CodingLoop {
  constructor(
    private readonly model: Model,
    private readonly tools: ToolRegistry,
    private readonly policy: Policy,
    private readonly git: GitWorkspace,
    private readonly workspace: Workspace
  ) {}

  async run(goal: string, maxIterations = 5): Promise<CodingIteration[]> {
    await this.workspace.init();
    const history: CodingIteration[] = [];

    for (let i = 0; i < maxIterations; i++) {
      const context = await this.git.status();
      const prompt = [
        'You are the coding loop of Sovereign Agent.',
        'Produce one small, reversible engineering step at a time.',
        'Never claim a file was changed unless the execution tool actually performed it.',
        'Prefer tests and checkpoints after meaningful changes.',
        `Goal: ${goal}`,
        `Iteration: ${i + 1}/${maxIterations}`,
        `Workspace git status:\n${context.stdout || '(clean)'}`,
        `Available capabilities:\n${this.tools.list().map(t => `${t.name} [${t.risk}] - ${t.description}`).join('\n') || '(none)'}`
      ].join('\n\n');

      const plan = await this.model.complete(prompt);
      const approval = this.policy.authorize('write');
      if (!approval.allowed) {
        history.push({ plan, result: `Execution blocked: ${approval.reason}` });
        break;
      }

      // Execution is deliberately explicit: a future coding backend will turn the plan into tool calls.
      // This boundary prevents the model from silently obtaining shell/Git access.
      const result = 'Plan generated. No write tool is attached yet; awaiting an approved coding backend.';
      const checkpoint = (await this.git.status()).code === 0 ? undefined : undefined;
      history.push({ plan, result, checkpoint });
      if (result.includes('awaiting')) break;
    }
    return history;
  }
}
