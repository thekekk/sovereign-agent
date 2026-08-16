export type AccountingKind = 'revenue' | 'compute' | 'infrastructure' | 'worker' | 'other';

export interface AccountingEvent {
  id: string;
  timestamp: string;
  kind: AccountingKind;
  amount: number;
  currency: string;
  source: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AccountingSummary {
  revenue: number;
  cost: number;
  net: number;
  byKind: Record<string, number>;
}

export class AccountingLedger {
  private readonly events: AccountingEvent[] = [];

  record(event: AccountingEvent): AccountingEvent {
    if (!Number.isFinite(event.amount) || event.amount < 0) {
      throw new Error('Accounting amount must be a finite non-negative number');
    }
    this.events.push({ ...event });
    return event;
  }

  recordRevenue(input: Omit<AccountingEvent, 'kind'>): AccountingEvent {
    return this.record({ ...input, kind: 'revenue' });
  }

  recordCost(input: Omit<AccountingEvent, 'kind'>): AccountingEvent {
    return this.record({ ...input, kind: 'other' });
  }

  all(): readonly AccountingEvent[] {
    return this.events;
  }

  summary(): AccountingSummary {
    let revenue = 0;
    let cost = 0;
    const byKind: Record<string, number> = {};

    for (const event of this.events) {
      byKind[event.kind] = (byKind[event.kind] ?? 0) + event.amount;
      if (event.kind === 'revenue') revenue += event.amount;
      else cost += event.amount;
    }

    return { revenue, cost, net: revenue - cost, byKind };
  }
}
