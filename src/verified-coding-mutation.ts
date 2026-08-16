import type { CheckpointManager } from './checkpoint.js';
import type { VerificationEvidence, VerificationProvider } from './verification.js';

export interface CodingMutationDependencies {
  writeFile(path: string, content: string): Promise<void>;
  runTests(command?: string): Promise<{ passed: boolean; output: string }>;
}

export interface CodingMutationResult {
  checkpointId: string;
  evidence: VerificationEvidence;
}

/** Transaction boundary for coding work: checkpoint -> mutate -> test/verify -> rollback on failure. */
export class VerifiedCodingMutation {
  constructor(
    private readonly checkpoints: Pick<CheckpointManager, 'create' | 'rollback'>,
    private readonly deps: CodingMutationDependencies,
    private readonly verifier: VerificationProvider<{ path: string; content: string; tests: { passed: boolean; output: string } }>
  ) {}

  async execute(path: string, content: string, testCommand?: string): Promise<CodingMutationResult> {
    const checkpoint = await this.checkpoints.create(`before coding mutation ${path}`);
    try {
      await this.deps.writeFile(path, content);
      const tests = await this.deps.runTests(testCommand);
      const evidence = await this.verifier.verify({ path, content, tests });
      if (!tests.passed || !evidence.verified) {
        await this.checkpoints.rollback(checkpoint);
      }
      return { checkpointId: checkpoint.id, evidence: tests.passed ? evidence : { ...evidence, verified: false, value: 0, reason: 'repository tests failed' } };
    } catch (error) {
      await this.checkpoints.rollback(checkpoint);
      throw error;
    }
  }
}
