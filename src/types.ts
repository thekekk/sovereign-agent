export type Risk = 'read' | 'write' | 'network' | 'financial' | 'system';

export interface ToolContext {
  taskId: string;
  signal?: AbortSignal;
}

export interface Tool<I = unknown, O = unknown> {
  name: string;
  description: string;
  risk: Risk;
  execute(input: I, context: ToolContext): Promise<O>;
}

export interface Task {
  id: string;
  goal: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  complete(input: string, signal?: AbortSignal): Promise<string>;
}
