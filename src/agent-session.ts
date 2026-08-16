import type { ModelMessage, ModelProvider } from './model-provider.js';
import type { ToolDispatcher, ToolPolicyContext } from './tool-dispatcher.js';
import type { ToolDefinition } from './tool-registry.js';

export interface AgentSessionLimits {
  maxTurns: number;
  maxToolCalls: number;
  maxOutputTokens: number;
}

export interface AgentSessionResult {
  status: 'completed' | 'budget-exhausted' | 'failed';
  messages: readonly ModelMessage[];
  toolCalls: number;
  outputTokens: number;
  reason: string;
}

/** Bounded model/tool loop. The model can request tools, never execute them directly. */
export class AgentSession {
  constructor(
    private readonly model: ModelProvider,
    private readonly dispatcher: ToolDispatcher,
    private readonly limits: AgentSessionLimits,
    private readonly tools: readonly ToolDefinition[] = []
  ) {}

  async run(messages: readonly ModelMessage[], policy: ToolPolicyContext, taskId = 'agent-session'): Promise<AgentSessionResult> {
    const history = [...messages];
    let toolCalls = 0;
    let outputTokens = 0;

    for (let turn = 0; turn < this.limits.maxTurns; turn++) {
      const response = await this.model.complete({
        messages: history,
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as Record<string, unknown>
        })),
        maxOutputTokens: Math.max(0, this.limits.maxOutputTokens - outputTokens)
      });
      outputTokens += response.outputTokens ?? 0;
      if (response.text) history.push({ role: 'assistant', content: response.text });

      if (response.toolCalls.length === 0) {
        return { status: 'completed', messages: history, toolCalls, outputTokens, reason: 'model completed' };
      }

      for (const call of response.toolCalls) {
        if (toolCalls >= this.limits.maxToolCalls) {
          return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens, reason: 'tool-call budget exhausted' };
        }
        toolCalls++;
        const result = await this.dispatcher.dispatch(
          { name: call.name, arguments: call.arguments },
          policy,
          { taskId }
        );
        history.push({ role: 'tool', content: JSON.stringify({ toolCallId: call.id, name: call.name, result }) });
      }
    }

    return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens, reason: 'turn budget exhausted' };
  }
}
