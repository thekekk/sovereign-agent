import { describe, expect, it } from 'vitest';
import { VerifiedCodingMutation } from './verified-coding-mutation.js';
import type { VerificationEvidence } from './verification.js';

const evidence = (verified: boolean): VerificationEvidence => ({
  backend: 'local',
  verified,
  value: verified ? 1 : 0,
  reason: verified ? 'verified' : 'rejected'
});

function harness(testResult: { passed: boolean }, verification: VerificationEvidence) {
  const events: string[] = [];
  const checkpoints = {
    async create(reason: string) { events.push(`checkpoint:${reason}`); return { id: 'cp-1', commit: 'a'.repeat(40), createdAt: new Date().toISOString(), reason }; },
    async rollback() { events.push('rollback'); }
  };
  const deps = {
    async writeFile() { events.push('write'); },
    async runTests() { events.push('test'); return { ...testResult, output: 'test-output' }; }
  };
  const verifier = { async verify() { events.push('verify'); return verification; } };
  return { runner: new VerifiedCodingMutation(checkpoints, deps, verifier), events };
}

describe('VerifiedCodingMutation', () => {
  it('rolls back when tests fail', async () => {
    const { runner, events } = harness({ passed: false }, evidence(true));
    const result = await runner.execute('src/x.ts', 'bad');
    expect(events).toEqual(['checkpoint:before coding mutation src/x.ts', 'write', 'test', 'rollback']);
    expect(result.evidence.verified).toBe(false);
  });

  it('rolls back when tests pass but evidence is rejected', async () => {
    const { runner, events } = harness({ passed: true }, evidence(false));
    const result = await runner.execute('src/x.ts', 'untrusted');
    expect(events).toEqual(['checkpoint:before coding mutation src/x.ts', 'write', 'test', 'verify', 'rollback']);
    expect(result.evidence.verified).toBe(false);
  });

  it('keeps a verified mutation without rollback', async () => {
    const { runner, events } = harness({ passed: true }, evidence(true));
    const result = await runner.execute('src/x.ts', 'good');
    expect(events).toEqual(['checkpoint:before coding mutation src/x.ts', 'write', 'test', 'verify']);
    expect(result.evidence.verified).toBe(true);
    expect(result.evidence.value).toBeGreaterThan(0);
  });
});
