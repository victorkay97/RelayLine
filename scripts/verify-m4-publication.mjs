/**
 * Real, read-only Arkiv Tiramisu G1/G2 verification.
 * Transaction/entity/wallet supplied publicly by user on 2026-10-14.
 * Strictly NO private keys, signing wallets, CI secrets, or write operations.
 */
import { publicClient } from '../src/arkiv.mjs';
import { queryServiceRecords } from '../src/query.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
import { normalizeAddress, validateManifest } from '../src/policy.mjs';

const EXPECTED = Object.freeze({
  creator: '0x2d7cfff67d9e63e225e082371b205cb7518b5c24',
  transaction: '0x009368bc762eb37da627842823584a3d644d41db7278582106f7c9273637b7e1',
  entityKey: '0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc'
});
const fail = (message) => { throw Error(message); };
const lower = v => String(v??'').toLowerCase();

function requireMatch(actual, expected, field) {
  if (lower(actual)!==lower(expected)) fail(field+' mismatch: expected '+expected+', got '+String(actual));
}

async function main() {
  const client=publicClient();
  const network=await client.getChainId();
  if (network!==7738577) fail('Wrong chain: '+network);
  const head=await client.getBlockNumber();

  const receipt=await client.getTransactionReceipt({hash:EXPECTED.transaction});
  requireMatch(receipt.transactionHash,EXPECTED.transaction,'Transaction hash');
  requireMatch(receipt.from,EXPECTED.creator,'Transaction sender');
  if (receipt.status!=='success') fail('Transaction receipt status '+receipt.status);

  const entity=await client.getEntity(EXPECTED.entityKey);
  if (!entity) fail('Entity not found or expired');
  requireMatch(entity.key,EXPECTED.entityKey,'Entity key');
  requireMatch(entity.creator,EXPECTED.creator,'Immutable entity creator');
  if (typeof entity.createdAt!=='bigint' || typeof entity.expiresAt!=='bigint' || entity.expiresAt<=head)
    fail('Entity missing active lifetime or already expired');
  if (entity.createdAt>head) fail('Future creation block');
  if (entity.attributes?.project?.type!=='str' || entity.attributes.project.value!=='relayline-v1')
    fail('Wrong project attribute');
  if (entity.attributes?.kind?.type!=='str' || entity.attributes.kind.value!=='manifest')
    fail('Not a RelayLine manifest');
  const payload=entity.toJson();
  const manifest=validateManifest(payload);
  if (entity.attributes.service_id?.type!=='str' || entity.attributes.service_id.value!==manifest.service_id)
    fail('Service ID attribute/payload mismatch');
  if (entity.attributes.revision?.type!=='u64' ||
      entity.attributes.revision.value!==BigInt(manifest.revision))
    fail('Revision attribute/payload mismatch');

  const snapshot=await queryServiceRecords(client,manifest.service_id);
  const decision=resolveServiceState(snapshot.entities,{
    serviceId:manifest.service_id,pinnedPublisher:EXPECTED.creator,
    headBlock:snapshot.headBlock
  });
  if (!decision.selected) fail('G2 independent reader rejected record: '+decision.issue);
  requireMatch(decision.selected.key,EXPECTED.entityKey,'Independent reader selected key');
  requireMatch(decision.activeSigner,EXPECTED.creator,'Independent reader signer');
  // Read-only negative control uses another wallet as the expected root and must refuse the record.
  const impostorCheck=resolveServiceState(snapshot.entities,{
    serviceId:manifest.service_id,
    pinnedPublisher:'0x3333333333333333333333333333333333333333',
    headBlock:snapshot.headBlock
  });
  if (impostorCheck.selected?.key?.toLowerCase()===EXPECTED.entityKey.toLowerCase())
    fail('SECURITY FAILURE: reader accepted a manifest despite wrong pinned wallet');

  console.log(JSON.stringify({
    result:'PASS',kind:'REAL_TIRAMISU_INDEPENDENT_VERIFICATION',
    checks:{G1:'PASS',G2:'PASS',G3:'NOT_TESTED_ON_CHAIN',G4:'NOT_TESTED_ON_CHAIN'},
    chainId:network,
    queryHeadBlock:snapshot.headBlock.toString(),
    currentBlock:head.toString(),
    txHash:receipt.transactionHash,
    txFrom:receipt.from,
    txStatus:receipt.status,
    txBlock:receipt.blockNumber.toString(),
    entityKey:entity.key,
    onchainCreator:entity.creator,
    entityCreatedBlock:entity.createdAt.toString(),
    entityExpiresBlock:entity.expiresAt.toString(),
    serviceId:manifest.service_id,
    revision:manifest.revision,
    endpoints:manifest.endpoints,
    readerSelectedKey:decision.selected.key,
    matchedRecords:snapshot.entities.length,
    rejectedByReader:decision.rejected?.map(e=>({key:e.key,reason:e.reason})),
    negativeControl:'Different pinned wallet did not accept trusted record',
    disclaimer:'Negative control is local trust-policy evaluation, NOT attacker-signed onchain creation',
    checkedAt:new Date().toISOString()
  },null,2));
}
main().catch(error=>{
  console.error(JSON.stringify({result:'FAIL',kind:'REAL_TIRAMISU_INDEPENDENT_VERIFICATION',
    error:error?.message,checkedAt:new Date().toISOString()},null,2));
  process.exitCode=1;
});
