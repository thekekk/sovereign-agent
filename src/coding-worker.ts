import { z } from 'zod';
import type { Model, ToolContext } from './types.js';
import type { SandboxedExecutor } from './executor.js';
import { Policy } from './policy.js';
import { WorkspaceReader } from './workspace-editor.js';
import { WorkspaceWriter } from './workspace-writer.js';

const actionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('read'), path: z.string(), maxBytes: z.number().int().positive().max(1_000_000).optional() }),
  z.object({ kind: z.literal('replace'), path: z.string(), expectedContent: z.string(), newContent: z.string().max(2_000_000) }),
  z.object({ kind: z.literal('test'), command: z.enum(['npm', 'npx', 'node', 'python', 'python3', 'git', 'sh']), args: z.array(z.string()).max(40).default([]) }),
  z.object({ kind: z.literal('stop'), reason: z.string().max(500) })
]);

type Action = z.infer<typeof actionSchema>;

export interface CodingWorkerConfig {
  maxIterations: number;
}

export interface CodingWorkerResult {
  status: 'completed' | 'stopped' | 'failed';
  iterations: number;
  history: string[];
}

/**
 * Model-directed coding loop. The model can propose only typed, bounded
 * actions; every action remains subject to the runtime policy and sandbox.
 */
export class CodingWorker {
  private readonly reader: WorkspaceReader;
  private readonly writer: WorkspaceWriter;

  constructor(
    private readonly model: Model,
    private readonly executor: SandboxedExecutor,
    private readonly policy = new Policy(),
    private readonly config: CodingWorkerConfig = { maxIterations: Number(process.env.SOVEREIGN_WORKER_ITERATIONS ?? 5) },
    workspace = process.env.SOVEREIGN_WORKSPACE ?? './workspace'
  ) {
    this.reader = new WorkspaceReader(workspace);
    this.writer = new WorkspaceWriter(workspace);
  }

  async run(goal: string): Promise<CodingWorkerResult> {
    const history: string[] = [];
    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      const prompt = [
        'You are a controlled autonomous coding worker.',
        `Goal: ${goal}`,
        `Iteration: ${iteration}/${this.config.maxIterations}`,
        'Choose exactly one action as JSON.',
        'Action kinds: read, replace, test, stop.',
        'For replace, expectedContent must exactly match the current file contents.',
        'Keep changes small and reversible. Never request secrets, host escape, or unrestricted commands.',
        history.length ? `Recent evidence:\n${history.slice(-4).join('\n')}` : 'No prior evidence.'
      ].join('\n');

      const raw = await this.model.complete(prompt);
      let action: Action;
      try {
        action = actionSchema.parse(JSON.parse(raw));
      } catch {
        history.push(`iteration ${iteration}: invalid model action`);
        return { status: 'failed', iterations: iteration, history };
      }

      const context: ToolContext = { taskId: `worker-${Date.now()}-${iteration}` };
      if (action.kind === 'stop') {
        history.push(`iteration ${iteration}: stopped — ${action.reason}`);
        return { status: 'stopped', iterations: iteration, history };
      }

      const risk = action.kind === 'replace' ? 'write' : action.kind === 'test' ? 'system' : 'read';
      const authorization = this.policy.authorize(risk);
      if (!authorization.allowed) {
        history.push(`iteration ${iteration}: policy denied ${action.kind} — ${authorization.reason}`);
        return { status: 'stopped', iterations: iteration, history };
      }

      if (action.kind === 'read') {
        const result = await this.reader.execute(action, context);
        history.push(`iteration ${iteration}: read ${result.path} (${result.bytes} bytes)`);
        continue;
      }

      if (action.kind === 'replace') {
        const result = await this.writer.execute(action, context);
        history.push(`iteration ${iteration}: replaced ${result.path} (${result.bytes} bytes)`);
        continue;
      }

      const result = await this.executor.execute({ command: action.command, args: action.args, timeoutMs: 120_000 }, context);
      history.push(`iteration ${iteration}: test ${action.command} exit=${result.code ?? -1}`);
      if (result.code === 0) return { status: 'completed', iterations: iteration, history };
    }

    return { status: 'stopped', iterations: this.config.maxIterations, history };
  }
}
