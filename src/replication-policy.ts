import type { SurvivalDecision } from './survival.js';

export interface ReplicationRequest {
  expectedHourlyValue: number;
  workerHourlyCost: number;
  runwayHours: number;
  currentWorkers: number;
}

export interface ReplicationDecision {
  approved: boolean;
  expectedNetPerHour: number;
  reason: string;
}

export class ReplicationPolicy {
  constructor(private readonly maxWorkers = 4, private readonly minimumRunwayHours = 48) {}

  evaluate(request: ReplicationRequest, survival: SurvivalDecision): ReplicationDecision {
    const expectedNetPerHour = request.expectedHourlyValue - request.workerHourlyCost;
    if (survival.priority !== 'grow') return { approved: false, expectedNetPerHour, reason: 'Agent is not in a growth state' };
    if (request.currentWorkers >= this.maxWorkers) return { approved: false, expectedNetPerHour, reason: 'Worker limit reached' };
    if (request.runwayHours < this.minimumRunwayHours) return { approved: false, expectedNetPerHour, reason: 'Runway below replication threshold' };
    if (expectedNetPerHour <= 0) return { approved: false, expectedNetPerHour, reason: 'Worker has non-positive expected economics' };
    return { approved: true, expectedNetPerHour, reason: 'Bounded replication has positive expected economics' };
  }
}
