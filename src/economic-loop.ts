import { DurableAccountingLedger } from './durable-accounting.js';
import { DurableSurvivalState } from './survival-state.js';
import { SurvivalEngine, type SurvivalSnapshot } from './survival.js';
import { ReplicationBudgetEngine, type ReplicationBudget } from './replication-budget.js';
import { OutcomeLedger, type OutcomeEvent } from './outcome-ledger.js';
import { FitnessEngine } from './fitness.js';

export interface EconomicCycle {
  snapshot: SurvivalSnapshot;
  decision: ReturnType<SurvivalEngine['evaluate']>;
  replication: ReplicationBudget;
  fitness: ReturnType<FitnessEngine['score']>;
}

export class EconomicLoop {
  private readonly survival = new SurvivalEngine();
  private readonly state: DurableSurvivalState;
  private readonly accounting: DurableAccountingLedger;
  private readonly outcomes: OutcomeLedger;
  private readonly fitness = new FitnessEngine();
  private readonly replication = new ReplicationBudgetEngine();

  constructor(dbPath = process.env.SOVEREIGN_DB ?? 'sovereign.db') {
    this.state = new DurableSurvivalState(dbPath);
    this.accounting = new DurableAccountingLedger(dbPath);
    this.outcomes = new OutcomeLedger(dbPath);
  }

  initialize(initial: SurvivalSnapshot): SurvivalSnapshot {
    const existing = this.state.load();
    if (existing) return existing;
    this.state.save(initial);
    return initial;
  }

  recordOutcome(event: OutcomeEvent): void {
    this.outcomes.record(event);
    if (event.cost > 0) {
      this.accounting.record({
        id: `${event.id ?? event.taskId}:cost`,
        timestamp: event.timestamp ?? new Date().toISOString(),
        kind: 'compute',
        amount: event.cost,
        currency: 'USD',
        source: event.source,
        metadata: event.metadata
      });
    }
    if (event.value > 0) {
      this.accounting.record({
        id: `${event.id ?? event.taskId}:value`,
        timestamp: event.timestamp ?? new Date().toISOString(),
        kind: 'revenue',
        amount: event.value,
        currency: 'USD',
        source: event.source,
        metadata: event.metadata
      });
    }
  }

  tick(initial?: SurvivalSnapshot): EconomicCycle {
    const current = this.state.load() ?? this.initialize(initial ?? {
      balance: 0,
      computeCostPerHour: 0,
      revenuePerHour: 0,
      health: 100,
      offspring: 0,
      successes: 0,
      failures: 0,
      lastHeartbeat: new Date().toISOString()
    });
    const decision = this.survival.evaluate(current);
    const replication = this.replication.calculate(decision);
    const fitness = this.fitness.score(this.outcomes.summary());
    return { snapshot: current, decision, replication, fitness };
  }

  accountingLedger(): DurableAccountingLedger {
    return this.accounting;
  }

  outcomeLedger(): OutcomeLedger {
    return this.outcomes;
  }
}
