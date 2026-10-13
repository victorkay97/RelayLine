import { publicClient, RPC } from '../src/arkiv.mjs';
const startedAt = new Date().toISOString();
try {
  const client = publicClient();
  const [chainId, block] = await Promise.all([client.getChainId(), client.getBlockNumber()]);
  if (chainId !== 7738577) throw new Error('Expected Tiramisu chain ID 7738577');
  console.log(JSON.stringify({ result: 'PASS', stage: 'read_only_rpc', rpc: RPC,
    chainId, block: block.toString(), startedAt }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', stage: 'read_only_rpc', rpc: RPC,
    error: error.message, startedAt }, null, 2));
  process.exitCode = 1;
}
