import { describe, expect, it } from 'vitest';
import { EvidenceVerifier } from './evidence.js';

describe('EvidenceVerifier', () => {
  const verifier = new EvidenceVerifier();

  it('rejects low-confidence evidence from establishing value', () => {
    const evidence = verifier.verify({
      kind: 'test', source: 'local-ci', observedAt: new Date().toISOString(),
      claim: 'tests passed', verified: true, confidence: 0.5
    });
    expect(evidence.verified).toBe(false);
    expect(verifier.verifiedValue(10, [evidence])).toBe(0);
  });

  it('accepts independently verified high-confidence evidence', () => {
    const evidence = verifier.verify({
      kind: 'ci', source: 'github-actions', observedAt: new Date().toISOString(),
      claim: 'CI passed', verified: true, confidence: 0.99, reference: 'run-123'
    });
    expect(evidence.verified).toBe(true);
    expect(verifier.verifiedValue(10, [evidence])).toBe(10);
  });
});
