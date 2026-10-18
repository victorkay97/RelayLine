/**
 * Read-only verification of a user-supplied M5 monitor transaction.
 * NEVER signs, transfers funds, or reads private wallet secrets.
 * This intentionally does not persist as a regularly scheduled CI gate:
 * observations expire after 10 minutes.
 */
import { publicClient } from '../src/arkiv.mjs';
import { queryServiceRecords } from '../src/query.mjs';
import { validateObservation, evaluateMonitorEvidence } from '../src/monitor-policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';

const expected={
  creator:'0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e',
  tx:'0xa0fc444931ba33b720ee3ea4a30e827952c8e9e5411c67d22fffa536a7d58031',
  entity:'0xaf1ce413b2274736ce1d180421fae1a066934e4abc6407e66e2cb85fc5862b90',
  service:'relayline-demo-oct14',
  endpoint:'fallback',
  manifest:'0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc',
  originalPublisher:'0x2d7cfff67d9e63e225e082371b205cb7518b5c24',
  url:'https://relayline-test-fallback.vercel.app/'
};
const equal=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
const ensure=(value,message)=>{if(!value)throw Error(message);};
async function run(){
  const client=publicClient();
  ensure(await client.getChainId()===7738577,'Wrong chain');
  const tx=await client.getTransactionReceipt({hash:expected.tx});
  ensure(tx.status==='success','Transaction is not successful');
  ensure(equal(tx.from,expected.creator),'Transaction sender mismatch');
  const {headBlock,entities}=await queryServiceRecords(client,expected.service);
  const observation=entities.find(x=>equal(x.key,expected.entity));
  if (!observation) throw Error('Observation not in ACTIVE query (may have expired; receipt was '+tx.status+')');
  ensure(equal(observation.creator,expected.creator),'Immutable creator differs from monitoring wallet');
  ensure(observation.attributes?.kind?.value==='observation','Wrong record kind');
  ensure(observation.attributes?.project?.value==='relayline-v1','Wrong project');
  ensure(observation.attributes?.service_id?.value===expected.service,'Wrong service attribute');
  ensure(observation.attributes?.endpoint_id?.value===expected.endpoint,'Wrong endpoint attribute');
  ensure(observation.attributes?.status?.value==='reachable','Wrong status attribute');
  const data=validateObservation(observation.data,{nowMs:Date.now()});
  ensure(data.service_id===expected.service && data.endpoint_id===expected.endpoint,'Payload service/endpoint mismatch');
  ensure(equal(data.manifest_key,expected.manifest),'Payload manifest mismatch');
  ensure(data.endpoint_url===expected.url,'Endpoint URL mismatch');
  ensure(data.status==='reachable','Observation status mismatch');
  ensure(typeof observation.expiresAt==='bigint' && observation.expiresAt>headBlock,'Observation expired');
  const decision=resolveServiceState(entities,{pinnedPublisher:expected.originalPublisher,serviceId:expected.service,headBlock});
  ensure(decision.selected&&equal(decision.selected.key,expected.manifest),'Original publisher manifest not selected');
  const results=evaluateMonitorEvidence(entities.filter(x=>x.attributes?.kind?.value==='observation'),{
    manifest:decision.selected.manifest,manifestKey:decision.selected.key,headBlock,
    trustedMonitorWallets:[expected.creator],quorum:2
  });
  const endpointResult=results.find(x=>x.endpoint_id===expected.endpoint);
  ensure(endpointResult?.reachable===1,'Wallet C was not counted as a valid trusted monitor');
  ensure(endpointResult?.status==='unknown','One trusted monitor must not meet 2-of-2 quorum');
  console.log(JSON.stringify({
    result:'PASS',gate:'M5_C_REAL_OBSERVATION_VERIFIED',chainId:7738577,
    creator:observation.creator,txHash:expected.tx,txBlock:tx.blockNumber.toString(),
    entityKey:observation.key,recordCreatedAtBlock:observation.createdAt.toString(),
    recordExpiresAtBlock:observation.expiresAt.toString(),queryHeadBlock:headBlock.toString(),
    endpointId:data.endpoint_id,httpStatus:data.http_status,reportedStatus:data.status,
    approvedManifestKey:decision.selected.key,
    singleMonitorTrustedCount:endpointResult.reachable,
    twoMonitorQuorumStatus:endpointResult.status,
    checkedAt:new Date().toISOString(),
    note:'Confirmed actual signed monitor entity. Two-wallet quorum is NOT established by one signer.'
  },null,2));
}
run().catch(error=>{console.error(JSON.stringify({result:'FAIL',gate:'M5_C_REAL_OBSERVATION_VERIFIED',error:error.message,checkedAt:new Date().toISOString()}));process.exitCode=1});
