import type { Opportunity } from './opportunity-bus.js';

export interface OpportunityOutcome {
  opportunityId: string;
  domain: Opportunity['domain'];
  venue: string;
  success: boolean;
  realizedValue?: number;
  estimatedValue: number;
  estimatedCost: number;
  error?: string;
  observedAt: string;
}

export interface OpportunityLesson {
  key: string;
  domain: Opportunity['domain'];
  venue: string;
  attempts: number;
  successes: number;
  realizedValue: number;
  realizedCost: number;
  confidence: number;
  lastObservedAt: string;
}

export class OpportunityOutcomeLearning {
  private readonly lessons = new Map<string, OpportunityLesson>();

  record(opportunity: Opportunity, outcome: Omit<OpportunityOutcome, 'opportunityId' | 'domain' | 'venue' | 'estimatedValue' | 'estimatedCost' | 'observedAt'>): OpportunityLesson {
    const key = `${opportunity.domain}:${opportunity.venue}`;
    const previous = this.lessons.get(key);
    const attempts = (previous?.attempts ?? 0) + 1;
    const successes = (previous?.successes ?? 0) + (outcome.success ? 1 : 0);
    const realizedValue = (previous?.realizedValue ?? 0) + (outcome.realizedValue ?? 0);
    const realizedCost = (previous?.realizedCost ?? 0) + opportunity.estimatedCost;
    const lesson: OpportunityLesson = {
      key, domain: opportunity.domain, venue: opportunity.venue, attempts, successes,
      realizedValue, realizedCost, confidence: successes / attempts, lastObservedAt: new Date().toISOString()
    };
    this.lessons.set(key, lesson);
    return lesson;
  }

  get(domain: Opportunity['domain'], venue: string): OpportunityLesson | undefined {
    return this.lessons.get(`${domain}:${venue}`);
  }

  all(): readonly OpportunityLesson[] { return [...this.lessons.values()]; }
}
