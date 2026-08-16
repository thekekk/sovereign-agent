import { Agent } from './agent.js';
import { Memory } from './memory.js';
import { Policy } from './policy.js';
import { OpenAIModel } from './model.js';
import { ToolRegistry } from './tools.js';
import { SandboxedExecutor } from './executor.js';

export function createRuntime(): Agent {
  const tools = new ToolRegistry();
  const executor = new SandboxedExecutor();
  tools.register(executor);

  // System-level execution remains blocked by the default policy until an
  // operator explicitly enables an approval flow. Registration != authorization.
  const policy = new Policy();
  return new Agent(new OpenAIModel(), new Memory(), tools, policy);
}
