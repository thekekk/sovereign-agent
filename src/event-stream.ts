export type AgentEvent =
  | { type: 'session.started'; sessionId: string; timestamp: string }
  | { type: 'agent.thought'; sessionId: string; summary: string; timestamp: string }
  | { type: 'tool.called'; sessionId: string; tool: string; timestamp: string }
  | { type: 'tool.result'; sessionId: string; tool: string; ok: boolean; timestamp: string }
  | { type: 'task.outcome'; sessionId: string; success: boolean; value: number; cost: number; timestamp: string }
  | { type: 'survival.changed'; sessionId: string; state: string; timestamp: string }
  | { type: 'session.completed'; sessionId: string; timestamp: string };

type Listener = (event: AgentEvent) => void;

export class EventStream {
  private readonly listeners = new Set<Listener>();
  private readonly history: AgentEvent[] = [];

  emit(event: AgentEvent): void {
    this.history.push(event);
    for (const listener of this.listeners) listener(event);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  events(): readonly AgentEvent[] { return this.history; }
}
