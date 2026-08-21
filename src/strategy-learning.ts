import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';
import { StrategyController, type StrategyDecision } from './strategy-controller.js';
import type { LineageStrategyMemory } from './lineage-strategy-memory.js';

export interface StrategyExperience { strategy: string; attempts: number; successes: number; totalValue: number; totalCost: number; }
export interface StrategyCandidate { name: string; basePriority: number; estimatedCost: number; }
export interface LearnedStrategyDecision extends StrategyDecision { selectedStrategy: string | null; confidence: number; }

export class StrategyLearning {
  constructor(private readonly policy = new StrategyController(), private readonly memory?: LineageStrategyMemory) {}

  decide(summary: OutcomeSummary, snapshot: SurvivalSnapshot, candidates: readonly StrategyCandidate[], experience: readonly StrategyExperience[], context = '*'): LearnedStrategyDecision {
    const decision = this.policy.decide(summary, snapshot);
    if (decision.action === 'stop' || candidates.length === 0) return { ...decision, selectedStrategy: null, confidence: 0 };
    const ranked = candidates.filter(c => Number.isFinite(c.basePriority) && Number.isFinite(c.estimatedCost) && c.estimatedCost >= 0).map(candidate => {
      const history = experience.find(item => item.strategy === candidate.name);
      const attempts = history?.attempts ?? 0;
      const successRate = attempts > 0 ? (history?.successes ?? 0) / attempts : 0;
      const netValue = (history?.totalValue ?? 0) - (history?.totalCost ?? 0);
      const evidenceBonus = Math.min(1, attempts / 10) * (successRate * 0.7 + Math.max(-1, Math.min(1, netValue / Math.max(1, candidate.estimatedCost))) * 0.3);
      const lineage = this.memory?.resolve({ strategyId: candidate.name, context });
      const avoidPenalty = lineage?.winner === 'avoid' ? Math.min(2, Math.abs(lineage.score)) : 0;
      const memoryBonus = lineage?.winner === 'use' ? Math.min(0.5, lineage.score * 0.025) : 0;
      return { candidate, score: candidate.basePriority + evidenceBonus + memoryBonus - avoidPenalty };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best) return { ...decision, selectedStrategy: null, confidence: 0 };
    const spread = ranked.length > 1 ? best.score - ranked[1].score : 1;
    return { ...decision, selectedStrategy: best.candidate.name, confidence: Math.max(0, Math.min(1, 0.5 + spread / 2)) };
  }
}
