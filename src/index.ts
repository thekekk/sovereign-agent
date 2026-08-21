import { createRuntime } from './runtime.js';
import { launchAgent } from './agent-launcher.js';
import { WalletFactory } from './wallet-factory.js';
import { WalletVault } from './wallet-vault.js';

const goal = process.argv.slice(2).join(' ').trim();

if (!goal) {
  console.error('Usage: npm run dev -- "your goal"');
  process.exit(1);
}

const agent = createRuntime();
const result = await agent.run(goal);
console.log(result.output);

if (process.env.AGENT_BOOTSTRAP === 'true') {
  const masterKey = process.env.AGENT_VAULT_KEY;
  if (!masterKey) throw new Error('AGENT_VAULT_KEY is required when AGENT_BOOTSTRAP=true');
  const launch = launchAgent(new WalletFactory(new WalletVault(masterKey)));
  console.log(JSON.stringify({ bootstrap: launch }, null, 2));
}
