export const CAPABILITIES = {
  conway: {
    survivalTiers: true,
    heartbeat: true,
    skills: true,
    soul: true,
    selfModificationBoundary: true,
    lineage: true,
    identityBoundary: true,
    constitution: true,
    socialMessaging: false,
    onChainIdentity: false,
    realWalletPayments: false,
    sandboxProvisioning: false
  },
  openhands: {
    agentLoop: true,
    eventStream: true,
    sessionManager: true,
    sandboxRuntime: true,
    codingBackendBoundary: true,
    ephemeralWorkspaceAdapter: false,
    cloudScaling: false
  },
  goose: {
    multiProviderRegistry: true,
    extensionRegistry: true,
    mcpBoundary: true,
    acpBoundary: true,
    recipes: true,
    desktopUi: false,
    nativeRustRuntime: false
  }
} as const;
