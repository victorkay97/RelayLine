import { createPublicClient, createWalletClient } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { queryServiceManifests, queryServiceRecords } from './query.mjs';
import { publishWithWallet } from './write.mjs';

export const RPC = process.env.ARKIV_RPC_URL ?? 'https://rpc.tiramisu.db-chain.testnet.arkiv.network';

export function publicClient() {
  return createPublicClient({ chain: tiramisu, transport: http(RPC) });
}

export function walletClient(privateKeyEnv) {
  const privateKey = process.env[privateKeyEnv];
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(privateKeyEnv + ' must contain a test-only private key; never commit it.');
  }
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    client: createWalletClient({ chain: tiramisu, transport: http(RPC), account })
  };
}

export async function publishManifest({ privateKeyEnv, manifest, allowLoopback = false }) {
  const publisher = walletClient(privateKeyEnv);
  return publishWithWallet({
    publicClient: publicClient(), walletClient: publisher.client,
    account: publisher.address, manifest, allowLoopback
  });
}

export function readManifests(serviceId, opts = {}) {
  return queryServiceManifests(publicClient(), serviceId, opts);
}

/** Fetch all kinds in a single Arkiv snapshot for rotation, revocation and manifest selection. */
export function readServiceRecords(serviceId, opts = {}) {
  return queryServiceRecords(publicClient(), serviceId, opts);
}
