/**
 * Read-only monitor-wallet preflight.
 * Never signs a transaction and never prints or submits private keys.
 * Run: node --env-file=.env.m5 scripts/diagnose-monitor.mjs
 */
import { formatEther } from 'viem';
import { walletClient, publicClient, readServiceRecords } from '../src/arkiv.mjs';

async function main() {
  const signer = walletClient('MONITOR_PRIVATE_KEY');
  const client = publicClient();
  const address = signer.address;
  const serviceId = process.env.MONITOR_SERVICE_ID;
  const [chainId, balance, latestNonce, pendingNonce] = await Promise.all([
    client.getChainId(),
    client.getBalance({ address }),
    client.getTransactionCount({ address, blockTag: 'latest' }),
    client.getTransactionCount({ address, blockTag: 'pending' })
  ]);
  if (chainId !== 7738577) throw Error('Wrong chain; expected Arkiv Tiramisu (7738577).');
  let activeObservations = [];
  let queryNote = null;
  if (serviceId) {
    try {
      const { headBlock, entities } = await readServiceRecords(serviceId);
      activeObservations = entities.filter(item =>
        item?.attributes?.kind?.value === 'observation' &&
        item?.creator?.toLowerCase() === address.toLowerCase() &&
        typeof item?.expiresAt === 'bigint' &&
        item.expiresAt > headBlock
      ).map(item => ({
        entityKey: item.key,
        expiresAtBlock: item.expiresAt.toString(),
        endpointId: item?.data?.endpoint_id ?? null,
        status: item?.data?.status ?? null
      }));
    } catch (error) {
      queryNote = 'Observation query unavailable: ' + error.message;
    }
  }
  const originalPublisher = '0x2d7cfff67d9e63e225e082371b205cb7518b5c24';
  const previousTestWallet = '0x024e3989ff6ed673c90613815dca3017ab9ea50d';
  console.log(JSON.stringify({
    mode: 'READ_ONLY_NO_TRANSACTION',
    walletAddress: address,
    roleHint: address.toLowerCase() === originalPublisher ? 'ORIGINAL_PUBLISHER_A — DO NOT USE AS MONITOR C' :
      address.toLowerCase() === previousTestWallet ? 'PREVIOUS_TEST_WALLET_B' : 'SEPARATE_WALLET — VERIFY THIS IS C',
    chainId, balanceGLM: formatEther(balance),
    transactionCountLatest: latestNonce,
    transactionCountPending: pendingNonce,
    activeObservations, queryNote,
    note: 'A nonzero transaction count does not prove monitoring succeeded. A zero/low test GLM balance may prevent signing.'
  }, null, 2));
}
main().catch(error => {
  console.error('Read-only monitor preflight failed: ' + error.message);
  process.exitCode = 1;
});
