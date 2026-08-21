import { describe, expect, it } from 'vitest';
import { createWalletCapability, loadWalletConfigs } from './wallet-config.js';

describe('wallet config', () => {
  it('creates a disabled wallet unless execution is explicitly enabled', () => {
    expect(createWalletCapability({ walletId: 'w1', domains: ['crypto'], services: ['sandbox'] })).toEqual({ walletId: 'w1', canExecute: false, domains: ['crypto'], services: ['sandbox'] });
  });

  it('loads wallet capabilities from environment', () => {
    expect(loadWalletConfigs({ SOVEREIGN_WALLET_ID: 'w1', SOVEREIGN_WALLET_DOMAINS: 'crypto,xstocks', SOVEREIGN_WALLET_SERVICES: 'sandbox,exchange', SOVEREIGN_WALLET_EXECUTE: 'true' })).toEqual([{ walletId: 'w1', canExecute: true, domains: ['crypto', 'xstocks'], services: ['sandbox', 'exchange'] }]);
  });

  it('returns no wallet without an id', () => expect(loadWalletConfigs({})).toEqual([]));
});
