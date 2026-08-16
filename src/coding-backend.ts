import { SandboxedExecutor } from './executor.js';

export interface CodingRequest {
  prompt: string;
  cwd?: string;
}

export class CodingBackend {
  constructor(private readonly executor = new SandboxedExecutor()) {}

  async inspect(request: CodingRequest): Promise<string> {
    const result = await this.executor.execute({
      command: 'sh',
      args: ['-lc', 'printf "Repository: %s\\n" "$PWD"; find . -maxdepth 2 -type f | sort | head -200'],
      cwd: request.cwd,
      timeoutMs: 15_000
    }, { taskId: 'coding-inspect' });

    return result.code === 0 ? result.stdout : `${result.stdout}\n${result.stderr}`;
  }
}
