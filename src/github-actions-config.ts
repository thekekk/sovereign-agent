export interface GitHubActionsConfig {
  owner: string;
  repo: string;
  token: string;
  apiBaseUrl: string;
}

/** Loads GitHub credentials without exposing them to model prompts or logs. */
export function loadGitHubActionsConfig(env: NodeJS.ProcessEnv = process.env): GitHubActionsConfig {
  const token = env.GITHUB_TOKEN?.trim();
  const repository = env.GITHUB_REPOSITORY?.trim();
  if (!token) throw new Error('GITHUB_TOKEN is required for live GitHub operations');
  if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) throw new Error('GITHUB_REPOSITORY must be owner/repository');
  const [owner, repo] = repository.split('/');
  const apiBaseUrl = (env.GITHUB_API_URL?.trim() || 'https://api.github.com').replace(/\/$/, '');
  if (!/^https:\/\//.test(apiBaseUrl)) throw new Error('GITHUB_API_URL must use HTTPS');
  return { owner, repo, token, apiBaseUrl };
}
