import { mkdir, writeFile } from 'node:fs/promises';

const status = process.argv[2];
if (status !== 'success' && status !== 'failure' && status !== 'cancelled') {
  console.error('Usage: npm run ci:signal -- <success|failure|cancelled>');
  process.exit(2);
}

const signal = {
  schema: 1,
  source: 'github-actions',
  workflow: process.env.GITHUB_WORKFLOW ?? 'unknown',
  runId: process.env.GITHUB_RUN_ID ?? 'unknown',
  commit: process.env.GITHUB_SHA ?? 'unknown',
  status,
  timestamp: new Date().toISOString()
};

await mkdir('.sovereign', { recursive: true });
await writeFile('.sovereign/ci-signal.json', `${JSON.stringify(signal, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(signal));
