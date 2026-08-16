export type EvidenceKind = 'test' | 'ci' | 'artifact' | 'payment' | 'review';

export interface Evidence {
  kind: EvidenceKind;
  source: string;
  observedAt: string;
  claim: string;
  verified: boolean;
  confidence: number;
  reference?: string;
}

/** Independent evidence gate: economic value should only be trusted when supported. */
export class EvidenceVerifier {
  verify(evidence: Evidence): Evidence {
    if (!evidence.source.trim() || !evidence.claim.trim()) throw new Error('Evidence source and claim are required');
    if (!Number.isFinite(evidence.confidence) || evidence.confidence < 0 || evidence.confidence > 1) {
      throw new Error('confidence must be between 0 and 1');
    }
    return { ...evidence, verified: evidence.verified && evidence.confidence >= 0.8 };
  }

  verifiedValue(value: number, evidence: readonly Evidence[]): number {
    if (!Number.isFinite(value)) throw new Error('value must be finite');
    const verified = evidence.some(item => item.verified && item.confidence >= 0.8);
    return verified ? value : 0;
  }
}
