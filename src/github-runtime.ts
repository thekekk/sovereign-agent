import { GitHubActionsClient } from './github-actions-client.js';
import { loadGitHubActionsConfig, type GitHubActionsConfig } from './github-actions-config.js';
import { GitHubBranchCreator } from './github-branch-creator.js';
import { GitHubChildCiObserver } from './github-child-ci-observer.js';
import { GitHubWorkerVerifier } from './github-worker-verifier.js';

export interface GitHubRuntime {
  client: GitHubActionsClient;
  branches: GitHubBranchCreator;
  observer: GitHubChildCiObserver;
  verifier: GitHubWorkerVerifier;
}

/** Creates the narrow GitHub capability graph; the token never enters model-facing APIs. */
export function createGitHubRuntime(config: GitHubActionsConfig = loadGitHubActionsConfig()): GitHubRuntime {
  const client = new GitHubActionsClient(config);
  const branches = new GitHubBranchCreator(client);
  const observer = new GitHubChildCiObserver(client);
  const verifier = new GitHubWorkerVerifier(observer);
  return { client, branches, observer, verifier };
}
