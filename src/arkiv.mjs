import { createPublicClient, createWalletClient, ExpirationTime, jsonToPayload } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { str, u64 } from '@arkiv-network/sdk/attr';
import { eq } from '@arkiv-network/sdk/query';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { normalizeAddress, validateManifest } from './policy.mjs';

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
  return { address: account.address,
    client: createWalletClient({ chain: tiramisu, transport: http(RPC), account }) };
}
export async function publishManifest({ privateKeyEnv, manifest, allowLoopback = false }) {
  const validated = validateManifest(manifest, { allowLoopback });
  const wallet = walletClient(privateKeyEnv);
  const chain = publicClient();
  if (await chain.getChainId() !== 7738577) throw new Error('Not Tiramisu; refusing to write.');
  const write = await wallet.client.createEntity({
    contentType: 'application/json',
    payload: jsonToPayload(validated),
    attributes: {
      project: str('relayline-v1'),
      kind: str('manifest'),
      service_id: str(validated.service_id),
      revision: u64(BigInt(validated.revision))
    },
    expires: ExpirationTime.fromDays(30),
    flags: { readonly: true, permissionlessExtension: false }
  });
  return { creator: wallet.address, service_id: validated.service_id, revision: validated.revision,
    entityKey: write.entityKey, txHash: write.txHash, expiresAt: write.expiresAt.toString() };
}

/** An intentionally unfiltered diagnostic read. The policy engine must reject attacker records. */
export async function readManifests(serviceId, { creator } = {}) {
  const client = publicClient();
  if (await client.getChainId() !== 7738577) throw new Error('RPC is not Tiramisu.');
  let query = client.select({
    key: true, creator: true, createdAt: true, expiresAt: true, attributes: true, payload: true
  }).where(
    eq('project', str('relayline-v1')),
    eq('kind', str('manifest')),
    eq('service_id', str(serviceId))
  ).limit(200);
  if (creator) query = query.createdBy(normalizeAddress(creator));
  let page = await query.fetch();
  const headBlock = page.blockNumber;
  const entities = [];
  for (;;) {
    for (const entity of page.entities) {
      let data;
      try { data = entity.toJson(); } catch { data = null; }
      entities.push({
        key: entity.key, creator: entity.creator, createdAt: entity.createdAt,
        expiresAt: entity.expiresAt, attributes: entity.attributes, data
      });
    }
    if (!page.hasNextPage()) break;
    if (entities.length >= 2000) throw new Error('Too many manifests: refuse incomplete security selection.');
    page = await page.next();
  }
  return { headBlock, entities };
}
