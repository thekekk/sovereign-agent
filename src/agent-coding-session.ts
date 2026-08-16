import type { ModelProvider, ModelMessage } from './model-provider.js';
import type { ToolDispatcher, ToolPolicyContext } from './tool-dispatcher.js';
import type { ToolDefinition } from './tool-registry.js';
import type { VerifiedCodingMutation } from './verified-coding-mutation.js';

export interface CodingSessionLimits { maxTurns: number; maxToolCalls: number; maxOutputTokens: number; }
export interface CodingSessionResult { status: 'completed' | 'budget-exhausted'; messages: readonly ModelMessage[]; toolCalls: number; outputTokens: number; }

/** Agent session with repo.write bound to the transactional coding mutation path. */
export class AgentCodingSession {
  constructor(
    private readonly model: ModelProvider,
    private readonly dispatcher: ToolDispatcher,
    private readonly mutation: VerifiedCodingMutation,
    private readonly tools: readonly ToolDefinition[],
    private readonly limits: CodingSessionLimits
  ) {}

  async run(messages: readonly ModelMessage[], policy: ToolPolicyContext, taskId = 'coding-session'): Promise<CodingSessionResult> {
    const history = [...messages];
    let toolCalls = 0;
    let outputTokens = 0;
    for (let turn = 0; turn < this.limits.maxTurns; turn++) {
      const response = await this.model.complete({
        messages: history,
        tools: this.tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema as Record<string, unknown> })),
        maxOutputTokens: Math.max(0, this.limits.maxOutputTokens - outputTokens)
      });
      outputTokens += response.outputTokens ?? 0;
      if (response.text) history.push({ role: 'assistant', content: response.text });
      if (response.toolCalls.length === 0) return { status: 'completed', messages: history, toolCalls, outputTokens };
      for (const call of response.toolCalls) {
        if (toolCalls >= this.limits.maxToolCalls) return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens };
        toolCalls++;
        const result = call.name === 'repo.write'
          ? await this.mutation.execute((call.arguments as { path: string }).path, (call.arguments as { content: string }).content)
          : await this.dispatcher.dispatch({ name: call.name, arguments: call.arguments }, policy, { taskId });
        history.push({ role: 'tool', content: JSON.stringify({ toolCallId: call.id, name: call.name, result }) });
      }
    }
    return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens };
  }
}
