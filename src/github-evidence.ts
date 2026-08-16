import { EvidenceVerifier, type Evidence } from './evidence.js';

export interface GitHubRunEvidenceInput {
  runId: string;
  workflow: string;
  conclusion: string;
  sourceCommit: string;
  artifactDigest?: string;
  artifactCommit?: string;
  artifactRunId?: string;
  artifactWorkflow?: string;
  observedCommit: string;
}

export interface GitHubEvidenceResult {
  evidence: Evidence;
  verified: boolean;
  reason: string;
}

/** Verifies that a CI signal is tied to the exact source commit being evaluated. */
export class GitHubEvidenceAdapter {
  constructor(private readonly verifier = new EvidenceVerifier()) {}

  verify(input: GitHubRunEvidenceInput): GitHubEvidenceResult {
    const sourceMatches = input.sourceCommit === input.observedCommit;
    const artifactMatches = Boolean(
      input.artifactRunId === undefined || input.artifactRunId === input.runId
    ) && Boolean(
      input.artifactWorkflow === undefined || input.artifactWorkflow === input.workflow
    ) && Boolean(
      input.artifactCommit === undefined || input.artifactCommit === input.sourceCommit
    );

    const verified = input.conclusion === 'success' && sourceMatches && artifactMatches;
    const evidence = this.verifier.verify({
      kind: 'ci',
      source: 'github-actions',
      observedAt: new Date().toISOString(),
      claim: `${input.workflow} run ${input.runId}: ${input.conclusion}`,
      verified,
      confidence: verified ? 0.99 : 0.1,
      reference: input.artifactDigest ? `${input.runId}:${input.artifactDigest}` : input.runId
    });

    return {
      evidence,
      verified: evidence.verified,
      reason: verified ? 'CI provenance matches source commit and run metadata' : 'CI provenance could not be verified'
    };
  }
}
