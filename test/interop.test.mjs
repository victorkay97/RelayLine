import test from 'node:test';
import assert from 'node:assert/strict';
import { queryServiceManifests } from '../src/query.mjs';
import { publishWithWallet } from '../src/write.mjs';

const PUBLISHER = '0x1111111111111111111111111111111111111111';
const MANIFEST = {
  schema_version: 1, service_id: 'demo', revision: 3,
  endpoints: [
    { id: 'main', role: 'primary', url: 'https://primary.example.org/' },
    { id: 'backup', role: 'fallback', url: 'https://backup.example.org/' }
  ]
};

function makeMockQueryClient(overrides = {}) {
  const calls = [];
  let nextIndex = 0;
  const page2 = { blockNumber: 42n, entities: [{
    key: '0x' + 'a'.repeat(64), creator: PUBLISHER, createdAt: 38n,
    expiresAt: 400n, attributes: {}, toJson: () => MANIFEST
  }], hasNextPage: () => false };
  const page1 = { blockNumber: 42n, entities: [], hasNextPage: () => true,
    next: async () => { ++nextIndex; return page2; } };
  const builder = {
    where(...predicates) { calls.push(['where', predicates.length]); return this; },
    limit(n) { calls.push(['limit', n]); return this; },
    createdBy(address) { calls.push(['creator', address]); return this; },
    async fetch() { return overrides.page ?? page1; }
  };
  return { calls, getChainId: async () => overrides.chainId ?? 7738577,
    select() { return builder; }, paginationCount: () => nextIndex };
}

test('independent query validates chain, paginates and preserves creator', async () => {
  const client = makeMockQueryClient();
  const result = await queryServiceManifests(client, 'demo', { creator: PUBLISHER });
  assert.equal(result.headBlock, 42n);
  assert.equal(result.entities.length, 1);
  assert.equal(result.entities[0].creator, PUBLISHER);
  assert.equal(result.entities[0].data.revision, 3);
  assert.equal(client.paginationCount(), 1);
  assert.equal(client.calls.find(([name]) => name === 'creator')[1], PUBLISHER.toLowerCase());
});

test('query rejects incorrect chain before fetching', async () => {
  await assert.rejects(() => queryServiceManifests(makeMockQueryClient({ chainId: 1 }), 'demo'), /Wrong network/);
});

test('query rejects inconsistent snapshot blocks', async () => {
  const client = makeMockQueryClient({
    page: { blockNumber: 9n, entities: [], hasNextPage: () => true,
      next: async () => ({ blockNumber: 10n, entities: [], hasNextPage: () => false }) }
  });
  await assert.rejects(() => queryServiceManifests(client, 'demo'), /snapshot changed/);
});

test('query rejects unsafe IDs before contacting client', async () => {
  await assert.rejects(() => queryServiceManifests(makeMockQueryClient(), '../../admin'), /Invalid service ID/);
});

test('publisher validates wallet and creates read-only on-chain entity', async () => {
  let params;
  const walletClient = {
    account: { address: PUBLISHER },
    async createEntity(input) {
      params = input;
      return { entityKey: '0x' + 'a'.repeat(64), txHash: '0x' + 'b'.repeat(64), expiresAt: 100000n };
    }
  };
  const result = await publishWithWallet({
    publicClient: { getChainId: async () => 7738577 },
    walletClient, account: PUBLISHER, manifest: MANIFEST
  });
  assert.equal(result.revision, 3);
  assert.equal(params.flags.readonly, true);
  assert.equal(params.flags.permissionlessExtension, false);
  assert.equal(params.attributes.project.value, 'relayline-v1');
  assert.equal(params.attributes.revision.value, 3n);
  assert.equal(params.contentType, 'application/json');
  assert.equal(result.creator, PUBLISHER);
});

test('publisher rejects signer mismatch and wrong chain before a write', async () => {
  const walletClient = { account: { address: PUBLISHER },
    async createEntity() { throw new Error('SHOULD NOT WRITE'); } };
  await assert.rejects(() => publishWithWallet({
    publicClient: { getChainId: async () => 7738577 },
    walletClient, account: '0x2222222222222222222222222222222222222222', manifest: MANIFEST
  }), /does not match/);
  await assert.rejects(() => publishWithWallet({
    publicClient: { getChainId: async () => 1 },
    walletClient, account: PUBLISHER, manifest: MANIFEST
  }), /Incorrect Arkiv network/);
});
