# Sovereign Agent

A modular autonomous-agent runtime inspired by Conway Automaton, designed to combine persistent autonomy with stronger execution and safety boundaries.

## Current architecture

- **Agent core** — goal handling and autonomous planning loop
- **Persistent memory** — SQLite-backed task/result memory
- **Tool registry** — capability-based tools with explicit risk classes
- **Policy engine** — execution and financial/system risk gates
- **Model adapter** — OpenAI implementation with a provider boundary
- **CLI** — simple headless runtime suitable for Docker/VM deployment

## Roadmap

1. Sandboxed shell + filesystem executor
2. Git/GitHub coding backend
3. OpenHands-compatible coding adapter
4. Browser/web research tools
5. Heartbeat + durable job scheduler
6. Multi-agent delegation and worker pools
7. Wallet/treasury adapters with hard spending limits
8. Agent identity and signed action ledger
9. Self-evaluation, rollback and controlled self-improvement
10. Optional Conway-compatible economic/replication modules

## Design principle

Planning and execution are separate. The model can propose actions, but capabilities are granted through registered tools and enforced by policy. Financial and system actions are disabled by default.

## Run

```bash
npm install
npm run build
OPENAI_API_KEY=... npm start -- "inspect the repository and propose improvements"
```

Never commit API keys, private keys, wallet seeds, or production credentials.

## License

MIT
