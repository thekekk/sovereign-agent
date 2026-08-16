import OpenAI from 'openai';
import type { Model } from './types.js';

export class OpenAIModel implements Model {
  private readonly client = new OpenAI();

  constructor(private readonly model = process.env.SOVEREIGN_MODEL ?? 'gpt-5.6') {}

  async complete(input: string, signal?: AbortSignal): Promise<string> {
    const response = await this.client.responses.create(
      { model: this.model, input },
      signal ? { signal } : undefined
    );
    return response.output_text;
  }
}
