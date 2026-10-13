import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk';
import { str, u64 } from '@arkiv-network/sdk/attr';
import { normalizeAddress, validateManifest } from './policy.mjs';

/** Identical entity format for a browser-wallet publisher and a Node CLI test wallet. */
export async function publishWithWallet({ publicClient, walletClient, manifest, account, allowLoopback = false }) {
  const validated = validateManifest(manifest, { allowLoopback });
  if (await publicClient.getChainId() !== 7738577) throw new Error('Incorrect Arkiv network');
  const creator = normalizeAddress(account);
  if (!walletClient?.account || normalizeAddress(
    typeof walletClient.account === 'string' ? walletClient.account : walletClient.account.address
  ) !== creator) throw new Error('Publisher signing wallet does not match connected account');
  const result = await walletClient.createEntity({
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
  return {
    creator,
    service_id: validated.service_id,
    revision: validated.revision,
    entityKey: result.entityKey,
    txHash: result.txHash,
    expiresAt: result.expiresAt.toString()
  };
}
