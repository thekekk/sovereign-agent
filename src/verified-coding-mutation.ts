import type { CheckpointManager } from './checkpoint.js';
import type { VerificationEvidence, VerificationProvider } from './verification.js';
import type { OutcomeToLineage } from './outcome-to-lineage.js';

export interface CodingMutationDependencies {
  writeFile(path: string, content: string): Promise<void>;
  runTests(command?: string): Promise<{ passed: boolean; output: string }>;
}

export interface CodingMutationResult {
  checkpointId: string;
  evidence: VerificationEvidence;
}

export interface CodingMutationLearningContext {
  strategyId: string;
  context: string;
  originId: string;
}

/** Transaction boundary for coding work; completed outcomes are automatically recorded as lineage knowledge. */
export class VerifiedCodingMutation {
  constructor(
    private readonly checkpoints: Pick<CheckpointManager, 'create' | 'rollback'>,
    private readonly deps: CodingMutationDependencies,
    private readonly verifier: VerificationProvider<{ path: string; content: string; tests: { passed: boolean; output: string } }>,
    private readonly learning?: OutcomeToLineage
  ) {}

  async execute(path: string, content: string, testCommand?: string, learningContext?: CodingMutationLearningContext): Promise<CodingMutationResult> {
    const checkpoint = await this.checkpoints.create(`before coding mutation ${path}`);
    try {
      await this.deps.writeFile(path, content);
      const tests = await this.deps.runTests(testCommand);

      if (!tests.passed) {
        await this.checkpoints.rollback(checkpoint);
        const result: CodingMutationResult = { checkpointId: checkpoint.id, evidence: { backend: 'local', verified: false, value: 0, reason: 'repository tests failed' } };
        if (this.learning && learningContext) this.learning.record({ ...learningContext, outcome: result });
        return result;
      }

      const evidence = await this.verifier.verify({ path, content, tests });
      const result = { checkpointId: checkpoint.id, evidence };
      if (!evidence.verified) await this.checkpoints.rollback(checkpoint);
      if (this.learning && learningContext) this.learning.record({ ...learningContext, outcome: result });
      return result;
    } catch (error) {
      await this.checkpoints.rollback(checkpoint);
      throw error;
    }
  }
}
