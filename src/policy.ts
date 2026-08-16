import type { Risk } from './types.js';

export interface PolicyConfig {
  allowedRisks: Risk[];
  requireApprovalFor: Risk[];
  maxFinancialAmount: number;
}

export class Policy {
  constructor(private readonly config: PolicyConfig = {
    allowedRisks: ['read', 'write', 'network'],
    requireApprovalFor: ['financial', 'system'],
    maxFinancialAmount: 0
  }) {}

  authorize(risk: Risk, amount = 0): { allowed: boolean; reason: string } {
    if (!this.config.allowedRisks.includes(risk)) {
      return { allowed: false, reason: `Risk '${risk}' is not enabled` };
    }
    if (this.config.requireApprovalFor.includes(risk)) {
      return { allowed: false, reason: `Risk '${risk}' requires explicit approval` };
    }
    if (risk === 'financial' && amount > this.config.maxFinancialAmount) {
      return { allowed: false, reason: 'Financial limit exceeded' };
    }
    return { allowed: true, reason: 'Allowed by policy' };
  }
}
