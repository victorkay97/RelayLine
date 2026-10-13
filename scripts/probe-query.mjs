import { publicClient } from '../src/arkiv.mjs';
import { str } from '@arkiv-network/sdk/attr';
import { eq } from '@arkiv-network/sdk/query';

// Real read-only Arkiv SDK query. Empty results still validate query execution.
try {
  const client = publicClient();
  const page = await client.select({
    key: true, creator: true, expiresAt: true, attributes: true
  }).where(eq('project', str('relayline-v1'))).limit(5).fetch();
  if (!Array.isArray(page.entities)) throw new Error('Unexpected query result: missing entity array');
  console.log(JSON.stringify({
    result: 'PASS',
    stage: 'sdk_entity_query',
    query: 'project = str(relayline-v1)',
    snapshotBlock: page.blockNumber?.toString() ?? null,
    returnedEntities: page.entities.length,
    entityKeys: page.entities.map(item => item.key),
    checkedAt: new Date().toISOString()
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    result: 'FAIL',
    stage: 'sdk_entity_query',
    error: error.message,
    checkedAt: new Date().toISOString()
  }, null, 2));
  process.exitCode = 1;
}
