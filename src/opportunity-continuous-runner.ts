import type { Opportunity, OpportunityAdapter, WalletCapability } from './opportunity-bus.js';
import { OpportunityBus } from './opportunity-bus.js';
import { OpportunityDecisionEngine } from './opportunity-decision-engine.js';
import { OpportunityExecutionGate } from './opportunity-execution-gate.js';
import { OpportunityAutonomyBridge } from './opportunity-autonomy-bridge.js';
import type { AutonomousIterationController } from './autonomous-iteration-controller.js';

export interface OpportunityExecutor {
  execute(opportunity: Opportunity, signal: AbortSignal): Promise<{ success: boolean; value?: number; error?: string }>;
}

export interface OpportunityOutcome {
  opportunityId: string;
  domain: Opportunity['domain'];
  success: boolean;
  estimatedValue: number;
  realizedValue: number;
  estimatedCost: number;
  netValue: number;
  error?: string;
}

export interface OpportunityOutcomeSink { record(outcome: OpportunityOutcome): Promise<void> | void; }

export interface ContinuousRunnerConfig { maxCycles: number; stopOnExecutionFailure?: boolean; }

export interface ContinuousRunnerResult {
  cycles: number;
  outcomes: readonly OpportunityOutcome[];
  stopped: boolean;
  reason: string;
}

export class OpportunityContinuousRunner {
  constructor(
    private readonly bus: OpportunityBus,
    private readonly wallet: WalletCapability,
    private readonly bridge: OpportunityAutonomyBridge,
    private readonly executor: OpportunityExecutor,
    private readonly outcomes: OpportunityOutcomeSink,
    private readonly controller: AutonomousIterationController,
    private readonly config: ContinuousRunnerConfig
  ) {
    if (!Number.isInteger(config.maxCycles) || config.maxCycles < 1) throw new Error('maxCycles must be a positive integer');
  }

  static create(
    adapters: readonly OpportunityAdapter[],
    wallet: WalletCapability,
    executor: OpportunityExecutor,
    outcomes: OpportunityOutcomeSink,
    controller: AutonomousIterationController,
    config: ContinuousRunnerConfig,
    gate: OpportunityExecutionGate = new OpportunityExecutionGate(),
    decisions: OpportunityDecisionEngine = new OpportunityDecisionEngine()
  ): OpportunityContinuousRunner {
    const bus = new OpportunityBus();
    adapters.forEach(adapter => bus.register(adapter));
    return new OpportunityContinuousRunner(bus, wallet, new OpportunityAutonomyBridge(decisions, gate, controller), executor, outcomes, controller, config);
  }

  async run(signal?: AbortSignal): Promise<ContinuousRunnerResult> {
    const results: OpportunityOutcome[] = [];
    let cycles = 0;
    while (cycles < this.config.maxCycles) {
      if (signal?.aborted) return { cycles, outcomes: results, stopped: true, reason: 'aborted' };
      if (this.controller.halted || this.controller.count >= this.config.maxCycles) {
        return { cycles, outcomes: results, stopped: true, reason: this.controller.halted ? 'autonomy controller halted' : 'iteration limit reached' };
      }
      const opportunities = await this.bus.discover(signal);
      const bridge = await this.bridge.authorizeBest(opportunities, this.wallet);
      if (!bridge.allowed || !bridge.ranked) return { cycles, outcomes: results, stopped: false, reason: bridge.reason };

      const opportunity = bridge.ranked.opportunity;
      const abort = new AbortController();
      const onAbort = () => abort.abort(signal?.reason);
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        const execution = await this.executor.execute(opportunity, abort.signal);
        const outcome: OpportunityOutcome = {
          opportunityId: opportunity.id,
          domain: opportunity.domain,
          success: execution.success,
          estimatedValue: opportunity.estimatedValue,
          realizedValue: execution.value ?? 0,
          estimatedCost: opportunity.estimatedCost,
          netValue: (execution.value ?? 0) - opportunity.estimatedCost,
          error: execution.error
        };
        results.push(outcome);
        await this.outcomes.record(outcome);
        cycles += 1;
        if (!execution.success && this.config.stopOnExecutionFailure !== false) {
          this.controller.halt(execution.error ?? 'opportunity execution failed');
          return { cycles, outcomes: results, stopped: true, reason: execution.error ?? 'opportunity execution failed' };
        }
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    }
    return { cycles, outcomes: results, stopped: true, reason: 'cycle limit reached' };
  }
}
