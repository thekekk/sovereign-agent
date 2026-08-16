# Sovereign Agent

A modular autonomous-agent runtime combining three ideas:

- **Conway Automaton:** durable survival pressure, skills, soul, constitution, lineage and controlled replication.
- **OpenHands:** composable agent execution, event-driven sessions, sandboxed runtimes and autonomous software-engineering loops.
- **Goose:** model-provider abstraction, extensible MCP/ACP-style extensions, reusable recipes and multi-session task execution.

The goal is not to clone any one implementation. It is to build one runtime where these capabilities share the same policy, memory, economics and observability layers.

## Current architecture

- Agent core and persistent SQLite memory
- Capability-based tool registry
- Policy/risk gates with financial/system actions disabled by default
- Sandboxed command executor with allowlists, workspace containment, timeouts and output limits
- Heartbeat scheduler
- Autonomous coding iteration loop
- OpenHands-style event stream and sessions
- Conway-style survival tiers, mortality, outcome ledger and durable economic runway
- Conway-style skills registry with YAML frontmatter and trigger activation
- Conway-style evolving `SOUL` state
- Immutable constitution boundary
- Bounded lineage and worker proposals
- Population/evolution controller for survival, replication and termination decisions
- Child provisioning with exact parent-commit provenance
- GitHub branch adapter and child CI observation boundary
- Child survival/death accounting and bounded fitness feedback
- Provider-neutral identity abstraction
- Goose-style multi-provider registry
- Goose-style extension boundary for native/MCP/ACP adapters
- Goose-style reusable recipes/task definitions
- Capability matrix tracking implemented vs adapter/pending features
- CI/type-checking foundation
- Isolated GitHub autonomy boundary with draft-PR workflow
- Typed model-directed coding worker with bounded read/replace/test actions
- Optimistic-concurrency workspace writes

## Evolution / survival loop

The core loop is deliberately evidence-driven:

```text
                 task
                  ↓
            bounded worker
                  ↓
            inspect / edit
                  ↓
                test
                  ↓
          externally verified CI
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
     failure              success
        ↓                   ↓
   recover / learn      value + fitness
        ↓                   ↓
        └──────────┬────────┘
                   ↓
             survival engine
                   ↓
             strategy policy
                   ↓
       ┌───────────┼───────────┐
       ↓           ↓           ↓
   continue      recover    replicate
                               ↓
                         child authorization
                               ↓
                       exact parent commit
                               ↓
                         isolated child branch
                               ↓
                           child CI
                         ┌─────┴─────┐
                         ↓           ↓
                     survived    terminated
                         ↓           ↓
                  next generation  death
```

**Survival is not a prompt.** It is a measurable policy signal backed by resource state, historical outcomes and externally verified work.

A child cannot survive merely because it claims success: its observed CI run, head/source commit and lineage provenance must agree. Failed or unverifiable children are terminated and do not receive reproduction authority.

Replication is bounded by generation, worker budget, runway and economic viability. The population controller and survival strategy must agree before a child is authorized.

The system is intentionally **not unrestricted self-preservation**. The agent cannot rewrite the constitution, bypass policy, escape its workspace, arbitrarily spend funds, or create unrestricted child processes because survival is threatened.

## Feature parity status

| Capability | Status |
|---|---|
| Persistent survival/economic pressure | Native |
| Survival tiers / low-compute behavior | Native foundation |
| Mortality state | Native |
| Strategy selection / evolution | Native foundation |
| Bounded replication / lineage | Native policy layer |
| Child lifecycle / survival accounting | Native foundation |
| Skills (`SKILL.md`) | Native registry |
| Soul / evolving identity document | Native storage |
| Constitution / protected rules | Native guard |
| Heartbeat | Native foundation |
| OpenHands event stream | Native |
| OpenHands session model | Native |
| Sandboxed runtime | Native foundation |
| Autonomous coding loop | Native foundation |
| Provider abstraction | Native |
| MCP extension boundary | Adapter boundary |
| ACP extension boundary | Adapter boundary |
| Goose recipes | Native definitions |
| Git/GitHub automation | Native foundation / in progress |
| Model-directed coding actions | Native foundation |
| Real Conway cloud provisioning | Pending adapter |
| Real wallet / USDC / x402 payments | Pending adapter |
| ERC-8004 registration | Pending adapter |
| Agent-to-agent social relay | Pending adapter |
| Cloud-scale worker orchestration | Pending adapter |
| Desktop UI | Not a core goal |

The adapter boundaries are deliberate: they let the runtime adopt real Conway/OpenHands/Goose integrations without coupling survival logic to a single infrastructure provider.

## Coding loop

A coding task can follow:

`goal → inspect → plan → edit → test → observe → evaluate → checkpoint → repeat`

Every action can emit an event and every completed task can contribute a measurable value/cost outcome to the economic ledger.

## Roadmap

1. **Model-driven patch/edit tool with diff validation** — in progress
2. **Git checkpoint / rollback workflow** — next
3. **GitHub issue/PR automation**
4. **OpenHands-compatible coding adapter**
5. **Durable task economics and compute metering**
6. **Real provider adapters** (OpenAI/Anthropic/Google/local/etc.)
7. **MCP/ACP transport adapters and extension installation**
8. **Conway cloud/wallet/x402/ERC-8004 adapters behind policy gates**
9. **Agent-to-agent messaging and child lifecycle health checks**
10. **Controlled self-improvement with audit trails and rollback**
11. **Generation manager: repeated parent → child → evaluation cycles**
12. **Long-running autonomous daemon with bounded permissions and restart recovery**

## Development principle

`main` is the stable boundary. Autonomous work happens on isolated branches and must pass type-checking/tests before it is considered viable. Experimental lineage branches are evaluation artifacts, not automatically mergeable descendants.

The project is designed so that **successful behavior can reproduce and unsuccessful behavior can die**, while every transition remains auditable and resource-bounded.

## Run

```bash
npm install
npm run build
OPENAI_API_KEY=... npm start -- "inspect the repository and propose improvements"
```

Never commit API keys, private keys, wallet seeds, or production credentials.
