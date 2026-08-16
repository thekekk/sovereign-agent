export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ModelToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelResponse {
  text: string;
  toolCalls: readonly ModelToolCall[];
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
}

export interface ModelRequest {
  messages: readonly ModelMessage[];
  tools?: readonly ModelToolDefinition[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ModelToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ModelProvider {
  complete(request: ModelRequest): Promise<ModelResponse>;
}

/** A provider-neutral session. No provider-specific SDK types leak into the agent core. */
export class ModelSession {
  constructor(private readonly provider: ModelProvider) {}

  async send(messages: readonly ModelMessage[], tools: readonly ModelToolDefinition[] = []): Promise<ModelResponse> {
    return this.provider.complete({ messages, tools });
  }
}
