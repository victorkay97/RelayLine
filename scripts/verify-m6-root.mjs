/** M6 disposable root publication — read-only live Tiramisu verification.
 * Public record IDs only; NO wallet keys or chain writes.
 */
import {publicClient} from '../src/arkiv.mjs';
import {queryServiceRecords} from '../src/query.mjs';
import {resolveServiceState} from '../src/control-policy.mjs';
import {validateManifest} from '../src/policy.mjs';

const expected={
  network:7738577,service:'relayline-m6-oct18',
  publisher:'0x024e3989ff6ed673c90613815dca3017ab9ea50d',
  tx:'0x4f18e712705275f1281bb5053623227e5ae7094281d971ac9017235a3a82e75d',
  key:'0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91',
  primary:'https://relayline-test-primary.vercel.app/',
  fallback:'https://relayline-test-fallback.vercel.app/'
};
function assert(condition,msg){if(!condition)throw Error(msg)}
const same=(a,b)=>String(a??'').toLowerCase()===String(b??'');
async function run(){
  const client=publicClient();
  assert(await client.getChainId()===expected.network,'Wrong Arkiv chain');
  const receipt=await client.getTransactionReceipt({hash:expected.tx});
  assert(receipt.status==='success','No successful transaction receipt');
  assert(same(receipt.from,expected.publisher),'Transaction sender mismatch');
  const entity=await client.getEntity(expected.key);
  assert(entity&&same(entity.key,expected.key),'On-chain entity missing/mismatched');
  assert(same(entity.creator,expected.publisher),'Immutable creator mismatch');
  assert(entity.attributes?.project?.value==='relayline-v1','Wrong project attribute');
  assert(entity.attributes?.kind?.value==='manifest','Not a manifest');
  assert(entity.attributes?.service_id?.value===expected.service,'Wrong service attribute');
  const manifest=validateManifest(entity.toJson());
  assert(manifest.service_id===expected.service && manifest.revision===1,'Wrong service/revision');
  assert(entity.attributes?.revision?.value===1n,'Wrong revision attribute');
  assert(manifest.endpoints.find(x=>x.role==='primary')?.url===expected.primary,'Unexpected primary URL');
  assert(manifest.endpoints.find(x=>x.role==='fallback')?.url===expected.fallback,'Unexpected fallback URL');
  const {headBlock,entities}=await queryServiceRecords(client,expected.service);
  const result=resolveServiceState(entities,{pinnedPublisher:expected.publisher,serviceId:expected.service,headBlock});
  assert(result.selected&&same(result.selected.key,expected.key),'Independent reader did not accept root manifest: '+result.issue);
  assert(result.epoch===0,'Expected root epoch zero before rotation');
  console.log(JSON.stringify({
    result:'PASS',gate:'M6_ROOT_MANIFEST_ONCHAIN_VERIFIED',
    chainId:expected.network,
    txHash:expected.tx,transactionBlock:receipt.blockNumber.toString(),
    publisherCreator:entity.creator,
    entityKey:entity.key,entityExpiresAtBlock:String(entity.expiresAt),
    serviceId:expected.service,revision:manifest.revision,
    primary:expected.primary,fallback:expected.fallback,
    queryHeadBlock:String(headBlock),readerEpoch:result.epoch,
    selectedEntityKey:result.selected.key,
    checkedAt:new Date().toISOString(),
    note:'Successor version 2, rotation and revocation are separately pending.'
  },null,2));
}
run().catch(e=>{console.error(JSON.stringify({result:'FAIL',gate:'M6_ROOT_MANIFEST_ONCHAIN_VERIFIED',error:e.message}));process.exitCode=1;});
