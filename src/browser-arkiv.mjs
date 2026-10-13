import { createPublicClient, createWalletClient } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { custom, http } from 'viem';
import { queryServiceManifests } from './query.mjs';
import { publishWithWallet } from './write.mjs';

const CHAIN_HEX = '0x7614d1';
export const ARKIV_RPC_URL = 'https://rpc.tiramisu.db-chain.testnet.arkiv.network';

export function makePublicClient() {
  return createPublicClient({ chain: tiramisu, transport: http(ARKIV_RPC_URL) });
}
export async function readPublicManifests(serviceId) {
  return queryServiceManifests(makePublicClient(), serviceId);
}
export async function ensureWalletChain(provider) {
  const current = await provider.request({ method: 'eth_chainId' });
  if (BigInt(current) === 7738577n) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_HEX }] });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.request({ method: 'wallet_addEthereumChain', params: [{
      chainId: CHAIN_HEX, chainName: 'Arkiv Tiramisu',
      rpcUrls: [ARKIV_RPC_URL],
      nativeCurrency: { name: 'Test GLM', symbol: 'GLM', decimals: 18 },
      blockExplorerUrls: ['https://tiramisu.explorer.arkiv.network']
    }] });
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_HEX }] });
  }
  const switched = await provider.request({ method: 'eth_chainId' });
  if (BigInt(switched) !== 7738577n) throw new Error('Wallet did not switch to Tiramisu');
}
export async function connectPublisher(provider = globalThis.ethereum) {
  if (!provider?.request) throw new Error('Install an EVM-compatible browser wallet to publish');
  const addresses = await provider.request({ method: 'eth_requestAccounts' });
  if (!addresses?.length) throw new Error('No wallet account selected');
  await ensureWalletChain(provider);
  const account = addresses[0];
  return {
    account,
    wallet: createWalletClient({ chain: tiramisu, transport: custom(provider), account }),
    publicClient: makePublicClient()
  };
}
export async function publishFromBrowser({ session, manifest }) {
  await ensureWalletChain(globalThis.ethereum);
  const selected = await globalThis.ethereum.request({ method: 'eth_accounts' });
  if (!selected?.[0] || selected[0].toLowerCase() !== session.account.toLowerCase()) {
    throw new Error('Wallet account changed; reconnect to publish');
  }
  return publishWithWallet({
    publicClient: session.publicClient, walletClient: session.wallet,
    account: session.account, manifest
  });
}
