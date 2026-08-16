import { Agent } from './agent.js';
import { OpenAIModel } from './model.js';

const goal = process.argv.slice(2).join(' ').trim();

if (!goal) {
  console.error('Usage: npm run dev -- "your goal"');
  process.exit(1);
}

const agent = new Agent(new OpenAIModel());
const result = await agent.run(goal);
console.log(result.output);
