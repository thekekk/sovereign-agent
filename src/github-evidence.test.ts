import { describe, expect, it } from 'vitest';
import { GitHubEvidenceAdapter } from './github-evidence.js';

describe('GitHubEvidenceAdapter', () => {
  const adapter = new GitHubEvidenceAdapter();
  const base = {
    runId: '123', workflow: 'CI', conclusion: 'success', sourceCommit: 'a'.repeat(40),
    observedCommit: 'a'.repeat(40), artifactRunId: '123', artifactWorkflow: 'CI', artifactCommit: 'a'.repeat(40)
  };

  it('accepts matching verified provenance', () => {
    const result = adapter.verify(base);
    expect(result.verified).toBe(true);
    expect(result.evidence.confidence).toBeGreaterThan(0.8);
  });

  it('rejects a mismatched source commit', () => {
    const result = adapter.verify({ ...base, observedCommit: 'b'.repeat(40) });
    expect(result.verified).toBe(false);
    expect(result.evidence.verified).toBe(false);
  });

  it('rejects a non-success CI conclusion', () => {
    const result = adapter.verify({ ...base, conclusion: 'failure' });
    expect(result.verified).toBe(false);
  });
});
