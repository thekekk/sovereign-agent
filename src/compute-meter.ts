import { resourceUsage } from 'node:process';

export interface ComputeSample {
  startedAt: string;
  finishedAt: string;
  wallMs: number;
  userCpuMs: number;
  systemCpuMs: number;
}

export interface ComputePricing {
  usdPerCpuHour: number;
}

export class ComputeMeter {
  async measure<T>(fn: () => Promise<T>, pricing: ComputePricing = { usdPerCpuHour: Number(process.env.SOVEREIGN_CPU_USD_PER_HOUR ?? 0.05) }): Promise<{ result: T; sample: ComputeSample; costUsd: number }> {
    const start = resourceUsage();
    const startedAt = new Date().toISOString();
    const wallStart = performance.now();
    const result = await fn();
    const end = resourceUsage();
    const finishedAt = new Date().toISOString();
    const wallMs = performance.now() - wallStart;
    const userCpuMs = (end.userCPUTime - start.userCPUTime) / 1000;
    const systemCpuMs = (end.systemCPUTime - start.systemCPUTime) / 1000;
    const cpuHours = (userCpuMs + systemCpuMs) / 3_600_000;
    return { result, sample: { startedAt, finishedAt, wallMs, userCpuMs, systemCpuMs }, costUsd: cpuHours * pricing.usdPerCpuHour };
  }
}
