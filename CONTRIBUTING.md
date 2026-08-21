# Contributing

Thanks for helping expand Sovereign Agent.

## Development

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Run `npm run typecheck`.
4. Run `npm test -- --run`.
5. Keep provider-specific logic inside adapters; do not bypass the decision, freshness, capability, or execution gates.

## Adding a provider

Implement the provider contract, normalize external data into the canonical opportunity model, add tests for malformed/stale data, and document required environment variables. Providers must fail independently and must respect cancellation/timeouts.

## Security

Never commit private keys, vault keys, API tokens, seed phrases, or production credentials. Live execution must remain explicitly enabled and bounded.

## Pull requests

Describe the opportunity source, evidence model, failure behavior, and tests. Small, composable adapters are preferred over changes to core policy.
