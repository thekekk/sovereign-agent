import { describe, expect, it, vi } from 'vitest';
import { AgentCodingSession } from './agent-coding-session.js';

describe('AgentCodingSession', () => {
  it('routes repo.write through the verified mutation boundary', async () => {
    const mutation = { execute: vi.fn().mockResolvedValue({ checkpointId: 'cp-1', evidence: { backend: 'local', verified: true, value: 1, reason: 'verified' } }) };
    const dispatcher = { dispatch: vi.fn() };
    const model = {
      complete: vi.fn()
        .mockResolvedValueOnce({ outputTokens: 1, text: null, toolCalls: [{ id: '1', name: 'repo.write', arguments: { path: 'src/x.ts', content: 'export const x = 1;' } }] })
        .mockResolvedValueOnce({ outputTokens: 1, text: 'done', toolCalls: [] })
    };
    const session = new AgentCodingSession(model as never, dispatcher as never, mutation as never, [{ name: 'repo.write', description: 'write', inputSchema: {} }] as never, { maxTurns: 3, maxToolCalls: 3, maxOutputTokens: 100 });

    await session.run([{ role: 'user', content: 'edit x' }], {} as never);

    expect(mutation.execute).toHaveBeenCalledWith('src/x.ts', 'export const x = 1;');
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
});
