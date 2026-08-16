import type { CheckpointManager } from './checkpoint.js';
import type { VerificationEvidence, VerificationProvider } from './verification.js';

export interface MutationExecution<T = unknown> {
  result: T;
  checkpointId: string;
}

/** Runs one mutation from a known-good checkpoint and restores it when evidence fails. */
export class VerifiedCheckpointRunner<T = unknown> {
  constructor(
    private readonly checkpoints: Pick<CheckpointManager, 'create' | 'rollback'>,
    private readonly verifier: VerificationProvider<T>
  ) {}

  async run(mutate: () => Promise<T>): Promise<{ execution: MutationExecution<T> | null; evidence: VerificationEvidence }> {
    const checkpointId = await this.checkpoints.create();
    try {
      const result = await mutate();
      const evidence = await this.verifier.verify(result);
      if (!evidence.verified) {
        await this.checkpoints.rollback(checkpointId);
        return { execution: null, evidence };
      }
      return { execution: { result, checkpointId }, evidence };
    } catch (error) {
      await this.checkpoints.rollback(checkpointId);
      throw error;
    }
  }
}
