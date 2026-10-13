import { str } from '@arkiv-network/sdk/attr';
import { eq } from '@arkiv-network/sdk/query';
import { normalizeAddress } from './policy.mjs';

const SERVICE_ID = /^[a-z0-9][a-z0-9-_]{0,62}$/;

/**
 * Database access shared by the Node CLI and the browser recovery reader.
 * Accepts an Arkiv public client; no proprietary API, no secret, no server.
 */
export async function queryServiceManifests(client, serviceId, { creator, maxEntities = 2000 } = {}) {
  if (typeof serviceId !== 'string' || !SERVICE_ID.test(serviceId)) throw new Error('Invalid service ID');
  if (!Number.isSafeInteger(maxEntities) || maxEntities < 1 || maxEntities > 10000) throw new Error('Invalid query limit');
  if (await client.getChainId() !== 7738577) throw new Error('Wrong network: expected Arkiv Tiramisu (7738577)');
  let query = client.select({
    key: true, creator: true, createdAt: true, expiresAt: true,
    attributes: true, payload: true
  }).where(
    eq('project', str('relayline-v1')),
    eq('kind', str('manifest')),
    eq('service_id', str(serviceId))
  ).limit(Math.min(200, maxEntities));
  if (creator) query = query.createdBy(normalizeAddress(creator));
  let page = await query.fetch();
  const headBlock = page.blockNumber;
  if (typeof headBlock !== 'bigint') throw new Error('Query lacks snapshot block');
  const entities = [];
  for (;;) {
    if (!Array.isArray(page.entities)) throw new Error('Invalid Arkiv page');
    if (entities.length + page.entities.length > maxEntities) {
      throw new Error('Too many manifests; refusing incomplete security selection');
    }
    for (const entity of page.entities) {
      let data;
      try { data = entity.toJson(); } catch { data = null; }
      entities.push({
        key: entity.key, creator: entity.creator, createdAt: entity.createdAt,
        expiresAt: entity.expiresAt, attributes: entity.attributes, data
      });
    }
    if (!page.hasNextPage()) break;
    page = await page.next();
    if (page.blockNumber !== headBlock) throw new Error('Query pagination snapshot changed');
  }
  return { headBlock, entities };
}
