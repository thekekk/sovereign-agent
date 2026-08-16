export interface RecipeStep {
  id: string;
  instruction: string;
  requiredSkills?: string[];
  timeoutMs?: number;
}

export interface Recipe {
  id: string;
  description: string;
  steps: RecipeStep[];
}

export class RecipeEngine {
  validate(recipe: Recipe): void {
    if (!recipe.id || recipe.steps.length === 0) throw new Error('Recipe must have an id and at least one step');
    const ids = new Set<string>();
    for (const step of recipe.steps) {
      if (ids.has(step.id)) throw new Error(`Duplicate recipe step: ${step.id}`);
      ids.add(step.id);
      if (!step.instruction.trim()) throw new Error(`Empty recipe instruction: ${step.id}`);
    }
  }
}
