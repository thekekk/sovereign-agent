import { randomUUID } from 'node:crypto';
import { EventStream } from './event-stream.js';

export interface Session {
  id: string;
  createdAt: string;
  status: 'active' | 'paused' | 'completed' | 'dead';
  metadata: Record<string, string>;
}

export class SessionManager {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly events = new EventStream()) {}

  create(metadata: Record<string, string> = {}): Session {
    const session: Session = {
      id: randomUUID(), createdAt: new Date().toISOString(), status: 'active', metadata
    };
    this.sessions.set(session.id, session);
    this.events.emit({ type: 'session.started', sessionId: session.id, timestamp: new Date().toISOString() });
    return session;
  }

  get(id: string): Session | undefined { return this.sessions.get(id); }

  setStatus(id: string, status: Session['status']): void {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Unknown session: ${id}`);
    session.status = status;
  }

  list(): Session[] { return [...this.sessions.values()]; }
}
