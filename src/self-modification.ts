import { createHash } from 'node:crypto';

export interface ModificationRequest {
  path: string;
  oldContent: string;
  newContent: string;
  reason: string;
}

export interface ModificationRecord {
  timestamp: string;
  path: string;
  reason: string;
  oldHash: string;
  newHash: string;
  approved: boolean;
}

/** Controlled self-editing: protected paths and audit records are mandatory. */
export class SelfModificationGuard {
  private readonly protectedPrefixes = ['constitution', 'src/constitution.ts', 'src/policy.ts', 'src/self-modification.ts'];
  private readonly audit: ModificationRecord[] = [];
  private readonly maxChangesPerHour: number;

  constructor(maxChangesPerHour = Number(process.env.SOVEREIGN_MAX_SELF_CHANGES ?? 20)) {
    this.maxChangesPerHour = Math.max(1, maxChangesPerHour);
  }

  approve(request: ModificationRequest): ModificationRecord {
    const now = Date.now();
    const recent = this.audit.filter(x => now - Date.parse(x.timestamp) < 3_600_000);
    const protectedPath = this.protectedPrefixes.some(prefix => request.path === prefix || request.path.startsWith(`${prefix}/`));
    const approved = !protectedPath && recent.length < this.maxChangesPerHour && request.reason.trim().length > 0;
    const record = {
      timestamp: new Date().toISOString(),
      path: request.path,
      reason: request.reason,
      oldHash: createHash('sha256').update(request.oldContent).digest('hex'),
      newHash: createHash('sha256').update(request.newContent).digest('hex'),
      approved
    };
    this.audit.push(record);
    return record;
  }

  history(): readonly ModificationRecord[] { return this.audit; }
}
