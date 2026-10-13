import { createServer } from 'node:http';
import { selectTrustedManifest, chooseRecovery } from '../src/policy.mjs';
// Local synthetic fixture: NEVER present this as proof of live Arkiv integration.
const publisher = '0x1111111111111111111111111111111111111111';
const attacker = '0x2222222222222222222222222222222222222';
const server = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain' });
  response.end('Authorized recovery endpoint is online');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const manifest = {
    schema_version: 1, service_id: 'demo', revision: 1,
    endpoints: [
      { id: 'main', role: 'primary', url: 'http://127.0.0.1:1/' },
      { id: 'backup', role: 'fallback', url: 'http://127.0.0.1:' + server.address().port + '/' }
    ]
  };
  const wrap = (key, creator, data) => ({
    key, creator, createdAt: 100n, expiresAt: 500n,
    attributes: { project: { type: 'str', value: 'relayline-v1' },
      kind: { type: 'str', value: 'manifest' },
      service_id: { type: 'str', value: 'demo' },
      revision: { type: 'u64', value: BigInt(data.revision) } }, data
  });
  const selection = selectTrustedManifest([
    wrap('0x' + 'a'.repeat(64), publisher, manifest),
    wrap('0x' + 'b'.repeat(64), attacker, { ...manifest, revision: 999 })
  ], { pinnedPublisher: publisher, serviceId: 'demo', headBlock: 200n, allowLoopback: true });
  if (!selection.selected || selection.rejected[0]?.reason !== 'untrusted_creator') {
    throw new Error('Root-wallet trust selection failed');
  }
  const recovery = await chooseRecovery(selection.selected.manifest);
  if (recovery.result !== 'recovered') throw new Error('Recovery failed');
  console.log(JSON.stringify({
    mode: 'OFFLINE_FIXTURE_NOT_ARKIV',
    trust: 'PASS', attackerRejected: true, primary: 'deliberately_down',
    recovery: recovery.result, authenticatedFallback: recovery.url
  }, null, 2));
} finally {
  await new Promise(resolve => server.close(resolve));
}
