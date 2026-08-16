import { DurableAccountingLedger } from './durable-accounting.js';
import { DurableSurvivalState } from './survival-state.js';
import { SurvivalEngine, type SurvivalSnapshot } from './survival.js';
import { ReplicationBudgetEngine, type ReplicationBudget } from './replication-budget.js';

export interface EconomicCycle {
  snapshot: SurvivalSnapshot;
  decision: ReturnType<SurvivalEngine['evaluate']>;
  replication: ReplicationBudget;
}

export class EconomicLoop {
  private readonly survival = new SurvivalEngine();
  private readonly state: DurableSurvivalState;
  private readonly accounting: DurableAccountingLedger;
  private readonly replication = new ReplicationBudgetEngine();

  constructor(dbPath = process.env.SOVEREIGN_DB ?? 'sovereign.db') {
    this.state = new DurableSurvivalState(dbPath);
    this.accounting = new DurableAccountingLedger(dbPath);
  }

  initialize(initial: SurvivalSnapshot): SurvivalSnapshot {
    const existing = this.state.load();
    if (existing) return existing;
    this.state.save(initial);
    return initial;
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
    return { snapshot: current, decision, replication };
  }

  accountingLedger(): DurableAccountingLedger {
    return this.accounting;
  }
}
