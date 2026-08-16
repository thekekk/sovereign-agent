import type { Tool } from './types.js';
import { ToolRegistry } from './tools.js';

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  protocol: 'native' | 'mcp' | 'acp';
  capabilities: string[];
}

export interface Extension {
  manifest: ExtensionManifest;
  tools: Tool[];
}

export class ExtensionRegistry {
  private readonly extensions = new Map<string, Extension>();

  install(extension: Extension, registry: ToolRegistry): void {
    this.extensions.set(extension.manifest.id, extension);
    for (const tool of extension.tools) registry.register(tool);
  }

  uninstall(id: string): Extension | undefined { return this.extensions.get(id); }
  list(): ExtensionManifest[] { return [...this.extensions.values()].map(e => e.manifest); }
}
