# Sovereign Agent

A modular autonomous-agent runtime inspired by Conway Automaton, with stronger execution controls and a survival/evolution layer for controlled autonomous growth.

## Current architecture

- Agent core and persistent SQLite memory
- Capability-based tool registry
- Policy/risk gates with financial/system actions disabled by default
- Sandboxed command executor with allowlists, workspace containment, timeouts and output limits
- Heartbeat scheduler
- Autonomous coding iteration loop
- Outcome ledger for measuring strategy value, cost and success
- Survival engine that converts economic/compute health into operational priorities
- Economy engine that preserves runway before allocating bounded replication budget
- Evolution and replication policies that select successful strategies and constrain worker growth
- Explicit mortality state that prevents further actions after terminal death
- CI/type-checking foundation

## Survival model

The goal is **survival pressure, not unrestricted self-preservation**. The agent receives an explicit resource state: balance, compute burn, revenue, health and historical outcomes. It must optimize useful work and positive unit economics to remain alive in the simulation.

The lifecycle is:

```text
             useful work
                  ↓
        ┌────── outcome ──────┐
        ↓                     ↓
      success               failure
        ↓                     ↓
  more resources       learn / recover
        ↓                     ↓
    thriving              stressed
        ↓                     ↓
 controlled growth       critical
        ↓                     ↓
  bounded replication*   shutdown → dead

* replication is an explicitly evaluated policy decision with runway,
  profitability and worker-count limits. The runtime does not give the
  model unrestricted process spawning, wallet control or host escape.
```

A failed agent can reach a terminal `dead` state in the simulation and loses the ability to continue acting. A successful agent can earn enough positive value to enter `thriving`; only then can the economic and replication policies recommend bounded growth. This captures the survival/evolution pressure from the original concept without turning safety controls into something the agent can rewrite.

## Coding loop

The runtime can iterate toward a coding goal by inspecting a workspace, proposing an implementation step, executing permitted tools, running tests, recording the outcome, and feeding the result into the next iteration. Git checkpoints and rollback are intended to make experimentation recoverable.

## Roadmap

1. Model-driven file edit tool with patch validation
2. Git checkpoint / rollback workflow
3. GitHub issue/PR integration
4. OpenHands-compatible coding backend
5. Durable survival state backed by SQLite
6. Revenue/compute accounting adapters
7. Controlled worker provisioning with hard quotas
8. Signed action ledger and identity
9. Self-evaluation and controlled self-improvement
10. Optional Conway-compatible economic/replication modules

## Run

```bash
npm install
npm run build
OPENAI_API_KEY=... npm start -- "inspect the repository and propose improvements"
```

Never commit API keys, private keys, wallet seeds, or production credentials.
