      const started = Date.now();
      const test = await this.executor.execute(
        { command: this.config.testCommand, args: this.config.testArgs, timeoutMs: 120_000 },
        { taskId: `coding-${Date.now()}-${iteration}` }
      );
      const durationMs = Date.now() - started;
      const success = test.code === 0;
      const cost = this.config.computeCostPerHour * durationMs / 3_600_000;
      const value = success ? this.config.successValue : 0;

      this.outcomes.record({
        taskId: `coding-${goal.slice(0, 40)}-${iteration}`,
        kind: success ? 'success' : 'failure',
        durationMs,
        cost,
        value,
        source: 'coding-loop',
        metadata: { iteration, exitCode: test.code ?? -1 }
      });

      const current = this.survival.load() ?? initial;
      const next = {
        ...current,
        balance: Math.max(0, current.balance - cost + value),
        successes: current.successes + (success ? 1 : 0),
        failures: current.failures + (success ? 0 : 1),
        computeCostPerHour: this.config.computeCostPerHour,
        revenuePerHour: this.config.successValue * 3600000 / Math.max(1, durationMs),
        lastHeartbeat: new Date().toISOString()
      };
      this.survival.save(next);