import { AutonomousIteration, type AutonomousIterationInput, type AutonomousIterationResult } from './autonomous-iteration.js';
import { AutonomousIterationController, type IterationResult } from './autonomous-iteration-controller.js';
import { StrategyController } from './strategy-controller.js';
import type { OutcomeLedger } from './outcome-ledger.js';
import type { ToolContext } from './types.js';

export interface AutonomousLoopRunResult {
  authorized: IterationResult;
  iteration?: AutonomousIterationResult;
}

/** Real execution boundary: failed recovery latches the outer controller before any further mutation. */
export class AutonomousLoopRunner {
  private readonly strategy: StrategyController;

  constructor(
    private readonly controller: AutonomousIterationController,
    private readonly iteration: AutonomousIteration,
    private readonly ledger: OutcomeLedger,
    strategy = new StrategyController(),
  ) { this.strategy = strategy; }

  async run(input: AutonomousIterationInput, context: ToolContext): Promise<AutonomousLoopRunResult> {
    const preflight = this.strategy.decide(this.ledger.summary(), input.survival);
    const authorized = await this.controller.authorize(preflight);
    if (!authorized.completed) return { authorized };

    const iteration = await this.iteration.run(input, context);
    if (iteration.recovery && !iteration.recovery.rolledBack) {
      this.controller.halt(`recovery failed: ${iteration.recovery.reason}`);
    }
    return { authorized, iteration };
  }
}
