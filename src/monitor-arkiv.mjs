import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk';
import { str } from '@arkiv-network/sdk/attr';
import { normalizeAddress } from './policy.mjs';
import { validateObservation, MONITOR_TTL_MINUTES } from './monitor-policy.mjs';
import { queryServiceRecords } from './query.mjs';

export async function publishObservation({
  publicClient, walletClient, account, observation, nowMs = Date.now()
}) {
  if (await publicClient.getChainId() !== 7738577) throw new Error('Incorrect Arkiv chain');
  const address = normalizeAddress(account);
  if (normalizeAddress(typeof walletClient?.account === 'string'
    ? walletClient.account : walletClient?.account?.address) !== address) {
    throw new Error('Monitor signing wallet mismatch');
  }
  const data = validateObservation(observation, { nowMs });
  const result = await walletClient.createEntity({
    payload: jsonToPayload(data), contentType: 'application/json',
    attributes: {
      project: str('relayline-v1'),
      kind: str('observation'),
      service_id: str(data.service_id),
      endpoint_id: str(data.endpoint_id),
      status: str(data.status)
    },
    expires: ExpirationTime.fromMinutes(MONITOR_TTL_MINUTES),
    flags: { readonly: true, permissionlessExtension: false }
  });
  return { creator: address, entityKey: result.entityKey, txHash: result.txHash,
    status: data.status, manifestKey: data.manifest_key };
}

export async function queryObservations(client, serviceId) {
  return queryServiceRecords(client, serviceId, { kind: 'observation' });
}
