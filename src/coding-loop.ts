import type { Model } from './types.js';
import type { SandboxedExecutor, ExecResult } from './executor.js';
import { OutcomeLedger } from './outcome-ledger.js';
import { DurableSurvivalState } from './survival-state.js';
import { StrategyController, type StrategyDecision } from './strategy-controller.js';

export interface CodingLoopConfig {
  maxIterations: number;
  testCommand: string;
  testArgs: string[];
  computeCostPerHour: number;
  successValue: number;
}

export interface CodingIteration {
  iteration: number;
  proposal: string;
  test: ExecResult;
  strategy: StrategyDecision;
}

/** Coding loop with durable outcome feedback and bounded survival policy. */
export class CodingLoop {
  private readonly outcomes: OutcomeLedger;
  private readonly survival: DurableSurvivalState;
  private readonly strategy = new StrategyController();

  constructor(
    private readonly model: Model,
    private readonly executor: SandboxedExecutor,
    private readonly config: CodingLoopConfig = {
      maxIterations: Number(process.env.SOVEREIGN_MAX_ITERATIONS ?? 5),
      testCommand: process.env.SOVEREIGN_TEST_COMMAND ?? 'npm',
      testArgs: (process.env.SOVEREIGN_TEST_ARGS ?? 'test').split(' ').filter(Boolean),
      computeCostPerHour: Number(process.env.SOVEREIGN_COMPUTE_COST_PER_HOUR ?? 1),
      successValue: Number(process.env.SOVEREIGN_SUCCESS_VALUE ?? 1)
    },
    outcomes = new OutcomeLedger(),
    survival = new DurableSurvivalState()
  ) {
    if (!Number.isFinite(config.computeCostPerHour) || config.computeCostPerHour < 0) throw new Error('computeCostPerHour must be finite and non-negative');
    if (!Number.isFinite(config.successValue) || config.successValue < 0) throw new Error('successValue must be finite and non-negative');
    this.outcomes = outcomes;
    this.survival = survival;
  }

  async run(goal: string): Promise<CodingIteration[]> {
    const results: CodingIteration[] = [];
    const initial = this.survival.load() ?? {
      balance: Number(process.env.SOVEREIGN_INITIAL_BALANCE ?? 10),
      computeCostPerHour: this.config.computeCostPerHour,
      revenuePerHour: 0,
      health: 100,
      offspring: 0,
      successes: 0,
      failures: 0,
      lastHeartbeat: new Date().toISOString()
    };
    this.survival.save(initial);

    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      const preDecision = this.strategy.decide(this.outcomes.summary(), this.survival.load() ?? initial);
      if (preDecision.action === 'stop') break;

      const proposal = await this.model.complete([
        'You are a coding agent operating inside a controlled workspace.',
        'Do not claim files were changed unless a tool actually changed them.',
        `Goal: ${goal}`,
        `Iteration: ${iteration}/${this.config.maxIterations}`,
        `Strategy directive: ${preDecision.action} — ${preDecision.reason}`,
        results.length ? `Previous test result:\n${JSON.stringify(results.at(-1)?.test)}` : 'No tests have run yet.',
        'Return the next implementation step. Prefer small, reversible changes when under recovery pressure.'
      ].join('\n'));

      const started = Date.now();
      const test = await this.executor.execute(
        { command: this.config.testCommand, args: this.config.testArgs, timeoutMs: 120_000 },
        { taskId: `coding-${Date.now()}-${iteration}` }
      );
      const durationMs = Date.now() - started;
      const success = test.code === 0;
      const cost = this.config.computeCostPerHour * durationMs / 3_600_000;
      const value = success ? this.config.successValue : 0;

      this.outcomes.record({
        taskId: `coding-${goal.slice(0, 40)}-${iteration}`,
        kind: success ? 'success' : 'failure',
        durationMs,
        cost,
        value,
        source: 'coding-loop',
        metadata: { iteration, exitCode: test.code ?? -1 }
      });

      const current = this.survival.load() ?? initial;
      const next = {
        ...current,
        balance: Math.max(0, current.balance - cost + value),
        successes: current.successes + (success ? 1 : 0),
        failures: current.failures + (success ? 0 : 1),
        computeCostPerHour: this.config.computeCostPerHour,
        revenuePerHour: this.config.successValue * 3600000 / Math.max(1, durationMs),
        lastHeartbeat: new Date().toISOString()
      };
      this.survival.save(next);

      const strategy = this.strategy.decide(this.outcomes.summary(), next);
      results.push({ iteration, proposal, test, strategy });

      if (success || strategy.action === 'stop') break;
    }
    return results;
  }
}
