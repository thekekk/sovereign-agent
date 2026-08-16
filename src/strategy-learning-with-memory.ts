import type { OutcomeSummary } from './outcome-ledger.js';
import type { SurvivalSnapshot } from './survival.js';
import { StrategyController, type StrategyDecision } from './strategy-controller.js';
import type { StrategyCandidate, StrategyExperience, LearnedStrategyDecision } from './strategy-learning.js';
import type { LineageStrategyMemory } from './lineage-strategy-memory.js';

/** Strategy selection with ancestral memory as a bounded scoring signal. */
export class StrategyLearningWithMemory {
  constructor(
    private readonly memory: LineageStrategyMemory,
    private readonly policy = new StrategyController()
  ) {}

  decide(
    summary: OutcomeSummary,
    snapshot: SurvivalSnapshot,
    candidates: readonly StrategyCandidate[],
    experience: readonly StrategyExperience[],
    context = '*'
  ): LearnedStrategyDecision {
    const decision: StrategyDecision = this.policy.decide(summary, snapshot);
    if (decision.action === 'stop' || candidates.length === 0) {
      return { ...decision, selectedStrategy: null, confidence: 0 };
    }

    const ranked = candidates
      .filter(c => Number.isFinite(c.basePriority) && Number.isFinite(c.estimatedCost) && c.estimatedCost >= 0)
      .map(candidate => {
        const history = experience.find(item => item.strategy === candidate.name);
        const attempts = history?.attempts ?? 0;
        const successRate = attempts ? (history?.successes ?? 0) / attempts : 0;
        const netValue = (history?.totalValue ?? 0) - (history?.totalCost ?? 0);
        const evidence = Math.min(1, attempts / 10) * (successRate * 0.7 + Math.max(-1, Math.min(1, netValue / Math.max(1, candidate.estimatedCost))) * 0.3);
        const lessons = this.memory.lessonsFor({ strategyId: candidate.name, context });
        const avoid = lessons.filter(l => l.kind === 'avoid' && l.confidence >= 0.7);
        const reusable = lessons.filter(l => l.kind === 'use' && l.confidence >= 0.5);
        const memoryBonus = reusable.reduce((sum, l) => sum + Math.min(0.5, l.confidence * 0.25), 0);
        const avoidPenalty = avoid.reduce((sum, l) => sum + Math.max(1, l.confidence * 2), 0);
        return { candidate, score: candidate.basePriority + evidence + memoryBonus - avoidPenalty };
      })
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score < -Infinity) return { ...decision, selectedStrategy: null, confidence: 0 };
    const spread = ranked.length > 1 ? best.score - ranked[1].score : 1;
    return {
      ...decision,
      selectedStrategy: best.candidate.name,
      confidence: Math.max(0, Math.min(1, 0.5 + spread / 2))
    };
  }
}
