import type { StrategyDecision } from './strategy-controller.js';

export interface IterationGate {
  beforeMutation(): Promise<{ allowed: boolean; reason: string }>;
}

export interface IterationResult {
  decision: StrategyDecision;
  completed: boolean;
  stopped: boolean;
  reason: string;
}

export interface AutonomousIterationControllerConfig {
  maxIterations: number;
}

/** Hard outer bound around autonomous mutation: recovery and iteration limits are authoritative. */
export class AutonomousIterationController {
  private iterations = 0;

  constructor(
    private readonly gate: IterationGate,
    private readonly config: AutonomousIterationControllerConfig
  ) {
    if (!Number.isInteger(config.maxIterations) || config.maxIterations < 1) {
      throw new Error('maxIterations must be a positive integer');
    }
  }

  async authorize(decision: StrategyDecision): Promise<IterationResult> {
    if (decision.action === 'stop') {
      return { decision, completed: false, stopped: true, reason: 'strategy stop is authoritative' };
    }
    if (this.iterations >= this.config.maxIterations) {
      return { decision, completed: false, stopped: true, reason: 'iteration limit reached' };
    }
    const gate = await this.gate.beforeMutation();
    if (!gate.allowed) {
      return { decision, completed: false, stopped: true, reason: gate.reason };
    }
    this.iterations += 1;
    return { decision, completed: true, stopped: false, reason: gate.reason };
  }

  reset(): void { this.iterations = 0; }
  get count(): number { return this.iterations; }
}
