import test from 'node:test';
import assert from 'node:assert/strict';
import { selectTrustedManifest, validateManifest, chooseRecovery, normalizeAddress } from '../src/policy.mjs';
const PUBLISHER = '0x1111111111111111111111111111111111111111';
const ATTACKER = '0x2222222222222222222222222222222222222222';
const KEY_A = '0x' + 'a'.repeat(64);
const KEY_B = '0x' + 'b'.repeat(64);
const KEY_C = '0x' + 'c'.repeat(64);
const manifest = (revision = 1) => ({
  schema_version: 1, service_id: 'demo', revision,
  endpoints: [
    { id: 'main', role: 'primary', url: 'https://primary.example.org/' },
    { id: 'backup', role: 'fallback', url: 'https://backup.example.org/' }
  ]
});
const entity = (key, creator, data = manifest(), expiresAt = 500n) => ({
  key, creator, expiresAt, createdAt: 100n,
  attributes: {
    project: { type: 'str', value: 'relayline-v1' },
    kind: { type: 'str', value: 'manifest' },
    service_id: { type: 'str', value: 'demo' },
    revision: { type: 'u64', value: BigInt(data.revision) }
  }, data
});
const options = { pinnedPublisher: PUBLISHER, serviceId: 'demo', headBlock: 200n };
test('valid publisher accepted; forged claim rejected', () => {
  const forged = entity(KEY_B, ATTACKER, { ...manifest(5), claimed_publisher: PUBLISHER });
  const result = selectTrustedManifest([forged, entity(KEY_A, PUBLISHER)], options);
  assert.equal(result.selected.key, KEY_A);
  assert.deepEqual(result.rejected, [{ key: KEY_B, reason: 'untrusted_creator' }]);
});
test('payload and owner cannot override immutable creator', () => {
  const forged = entity(KEY_B, ATTACKER, { ...manifest(), claimed_publisher: PUBLISHER });
  forged.owner = PUBLISHER;
  const result = selectTrustedManifest([forged], options);
  assert.equal(result.selected, null);
  assert.equal(result.issue, 'no_trusted_manifest');
});
test('expired record rejected', () => {
  const result = selectTrustedManifest([entity(KEY_A, PUBLISHER, manifest(), 200n)], options);
  assert.equal(result.selected, null);
  assert.equal(result.rejected[0].reason, 'expired');
});
test('higher revision wins; top-revision conflict fails closed', () => {
  assert.equal(selectTrustedManifest([
    entity(KEY_A, PUBLISHER), entity(KEY_B, PUBLISHER, manifest(2))
  ], options).selected.key, KEY_B);
  const result = selectTrustedManifest([
    entity(KEY_A, PUBLISHER), entity(KEY_B, PUBLISHER, manifest(2)),
    entity(KEY_C, PUBLISHER, manifest(2))
  ], options);
  assert.equal(result.selected, null);
  assert.equal(result.issue, 'conflicting_latest_revision');
});
test('reject non-HTTPS and wrong service identifier', () => {
  assert.throws(() => validateManifest({ ...manifest(), endpoints: [
    { id: 'main', role: 'primary', url: 'https://primary.example.org/' },
    { id: 'backup', role: 'fallback', url: 'http://evil.example.org/' }
  ] }), /HTTPS/);
  assert.throws(() => validateManifest(manifest(), { serviceId: 'another' }), /mismatch/i);
});
test('reject attribute/payload revision mismatch', () => {
  const bad = entity(KEY_A, PUBLISHER);
  bad.attributes.revision.value = 7n;
  const result = selectTrustedManifest([bad], options);
  assert.equal(result.selected, null);
  assert.match(result.rejected[0].reason, /revision_mismatch/);
});
test('down primary and reachable authorized fallback', async () => {
  const outcome = await chooseRecovery(manifest(), {
    probe: async endpoint => ({ id: endpoint.id, role: endpoint.role,
      status: endpoint.role === 'primary' ? 'unreachable' : 'reachable' })
  });
  assert.equal(outcome.result, 'recovered');
  assert.equal(outcome.url, 'https://backup.example.org/');
});
test('never claim recovery when all endpoints fail', async () => {
  const outcome = await chooseRecovery(manifest(), {
    probe: async endpoint => ({ id: endpoint.id, status: 'unreachable' })
  });
  assert.equal(outcome.result, 'no_reachable_endpoint');
  assert.equal(outcome.url, null);
});
test('reject invalid publisher root', () =>
  assert.throws(() => normalizeAddress('service-name'), /Invalid pinned/));
