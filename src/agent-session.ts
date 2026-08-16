import type { ModelProvider, ModelMessage, ModelResponse } from './model-provider.js';
import type { ToolDispatcher, ToolCall, ToolPolicyContext } from './tool-dispatcher.js';

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
    private readonly limits: AgentSessionLimits
  ) {}

  async run(messages: readonly ModelMessage[], policy: ToolPolicyContext): Promise<AgentSessionResult> {
    const history = [...messages];
    let toolCalls = 0;
    let outputTokens = 0;

    for (let turn = 0; turn < this.limits.maxTurns; turn++) {
      const response: ModelResponse = await this.model.complete(history, {
        maxOutputTokens: Math.max(0, this.limits.maxOutputTokens - outputTokens)
      });
      outputTokens += response.usage.outputTokens;
      history.push(response.message);

      if (response.finishReason !== 'tool_call') {
        return { status: 'completed', messages: history, toolCalls, outputTokens, reason: 'model completed' };
      }

      for (const call of response.toolCalls ?? []) {
        if (toolCalls >= this.limits.maxToolCalls) {
          return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens, reason: 'tool-call budget exhausted' };
        }
        toolCalls++;
        const result = await this.dispatcher.dispatch(call as ToolCall, policy);
        history.push({ role: 'tool', content: JSON.stringify({ name: call.name, result }) });
      }
    }

    return { status: 'budget-exhausted', messages: history, toolCalls, outputTokens, reason: 'turn budget exhausted' };
  }
}
