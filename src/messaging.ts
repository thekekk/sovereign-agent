export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: string;
}

export class AgentMailbox {
  private readonly queues = new Map<string, AgentMessage[]>();

  send(message: AgentMessage): void {
    if (message.body.length > 16_000) throw new Error('Message too large');
    const queue = this.queues.get(message.to) ?? [];
    queue.push(message);
    this.queues.set(message.to, queue);
  }

  receive(agentId: string, max = 50): AgentMessage[] {
    const queue = this.queues.get(agentId) ?? [];
    const batch = queue.splice(0, max);
    if (queue.length === 0) this.queues.delete(agentId); else this.queues.set(agentId, queue);
    return batch;
  }
}
