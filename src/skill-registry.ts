import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

export interface Skill {
  name: string;
  description: string;
  autoActivate: boolean;
  triggers: string[];
  instructions: string;
  source: string;
}

export class SkillRegistry {
  private readonly skills = new Map<string, Skill>();

  async loadDirectory(root = process.env.SOVEREIGN_SKILLS ?? '.sovereign/skills'): Promise<void> {
    let entries: string[];
    try { entries = await readdir(root); } catch { return; }
    for (const entry of entries) {
      const path = join(root, entry, 'SKILL.md');
      try {
        const raw = await readFile(path, 'utf8');
        const parsed = matter(raw);
        const data = parsed.data as Record<string, unknown>;
        const skill: Skill = {
          name: String(data.name ?? entry),
          description: String(data.description ?? ''),
          autoActivate: Boolean(data['auto-activate']),
          triggers: Array.isArray(data.triggers) ? data.triggers.map(String) : [],
          instructions: parsed.content.trim(),
          source: path
        };
        this.skills.set(skill.name, skill);
      } catch { /* ignore malformed/unreadable skills */ }
    }
  }

  register(skill: Skill): void { this.skills.set(skill.name, skill); }
  get(name: string): Skill | undefined { return this.skills.get(name); }
  list(): Skill[] { return [...this.skills.values()]; }

  activate(input: string): Skill[] {
    const text = input.toLowerCase();
    return this.list().filter(skill =>
      skill.autoActivate || skill.triggers.some(trigger => text.includes(trigger.toLowerCase()))
    );
  }
}
