# Sovereign Agent

A modular autonomous-agent runtime inspired by Conway Automaton, with stronger execution controls and a path toward autonomous software engineering.

## Current architecture

- Agent core and persistent SQLite memory
- Capability-based tool registry
- Policy/risk gates with financial/system actions disabled by default
- Sandboxed command executor with allowlists, workspace containment, timeouts and output limits
- Heartbeat scheduler
- Autonomous coding iteration loop
- CI/type-checking foundation

## Coding loop

The runtime can iterate toward a coding goal by asking the model for the next implementation step, executing the configured test command inside the controlled workspace, and feeding the result back into the next iteration.

This is deliberately separated from direct host administration. A future coding backend will add file-edit and Git operations behind the same policy boundary.

## Roadmap

1. Model-driven file edit tool with patch validation
2. Git checkpoint / rollback workflow
3. GitHub issue/PR integration
4. OpenHands-compatible coding backend
5. Browser/web research tools
6. Multi-agent delegation and worker pools
7. Wallet/treasury adapters with hard spending limits
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
