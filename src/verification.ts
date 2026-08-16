export type VerificationBackend = 'local' | 'github';

export interface VerificationEvidence {
  backend: VerificationBackend;
  verified: boolean;
  value: number;
  reason: string;
  sourceCommit?: string;
  runId?: number;
}

export interface VerificationProvider<TExecution = unknown> {
  verify(execution: TExecution): Promise<VerificationEvidence>;
}

/** Common evidence contract consumed by economics and evolution, regardless of backend. */
export class EvidenceGate<TExecution = unknown> {
  constructor(private readonly provider: VerificationProvider<TExecution>) {}

  async verify(execution: TExecution): Promise<VerificationEvidence> {
    const evidence = await this.provider.verify(execution);
    if (!Number.isFinite(evidence.value) || evidence.value < 0) {
      return { ...evidence, verified: false, value: 0, reason: 'Verifier returned invalid value' };
    }
    if (!evidence.verified) return { ...evidence, value: 0 };
    return evidence;
  }
}
