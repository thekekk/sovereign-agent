import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

export interface Skill {
  name: string;
  description: string;
  autoActivate: boolean;
  triggers: string[];
  instructions: string;
  source: string;
}

function parseSkill(raw: string, source: string, fallbackName: string): Skill {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const frontmatter = match ? parse(match[1]) as Record<string, unknown> : {};
  const content = match ? match[2] : raw;
  return {
    name: String(frontmatter.name ?? fallbackName),
    description: String(frontmatter.description ?? ''),
    autoActivate: Boolean(frontmatter['auto-activate']),
    triggers: Array.isArray(frontmatter.triggers) ? frontmatter.triggers.map(String) : [],
    instructions: content.trim(),
    source
  };
}

export class SkillRegistry {
  private readonly skills = new Map<string, Skill>();

  async loadDirectory(root = process.env.SOVEREIGN_SKILLS ?? '.sovereign/skills'): Promise<void> {
    let entries: string[];
    try { entries = await readdir(root); } catch { return; }
    for (const entry of entries) {
      const path = join(root, entry, 'SKILL.md');
      try { this.skills.set(entry, parseSkill(await readFile(path, 'utf8'), path, entry)); } catch { /* ignore */ }
    }
  }

  register(skill: Skill): void { this.skills.set(skill.name, skill); }
  get(name: string): Skill | undefined { return this.skills.get(name); }
  list(): Skill[] { return [...this.skills.values()]; }
  activate(input: string): Skill[] {
    const text = input.toLowerCase();
    return this.list().filter(skill => skill.autoActivate || skill.triggers.some(t => text.includes(t.toLowerCase())));
  }
}
