/** Read-only M5 quorum snapshot; trusted signers are public testnet identities.
 * Does not publish and does not claim a quorum if one expired.
 */
import {readServiceRecords} from '../src/arkiv.mjs';
import {resolveServiceState} from '../src/control-policy.mjs';
import {evaluateMonitorEvidence} from '../src/monitor-policy.mjs';
const SERVICE='relayline-demo-oct14';
const ROOT='0x2d7cfff67d9e63e225e082371b205cb7518b5c24';
const expectedManifest='0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc';
const MONITORS={
  B:'0x024e3989ff6ed673c90613815dca3017ab9ea50d',
  C:'0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e'
};
async function main(){
  const {entities,headBlock}=await readServiceRecords(SERVICE);
  const result=resolveServiceState(entities,{pinnedPublisher:ROOT,serviceId:SERVICE,headBlock});
  if(!result.selected||result.selected.key.toLowerCase()!==expectedManifest.toLowerCase())
    throw Error('Expected authorized publisher manifest not selected: '+result.issue);
  const observations=entities.filter(x=>x.attributes?.kind?.value==='observation');
  const monitorEvidence=evaluateMonitorEvidence(observations,{
    manifest:result.selected.manifest,manifestKey:result.selected.key,headBlock,
    trustedMonitorWallets:Object.values(MONITORS),quorum:2
  });
  const fallback=monitorEvidence.find(x=>x.endpoint_id==='fallback');
  const activeByWallet=Object.entries(MONITORS).map(([role,address])=>({
    role,address,
    observations:observations.filter(x=>x.creator?.toLowerCase()===address).map(x=>({
      entityKey:x.key,expiresAtBlock:String(x.expiresAt),
      reportedStatus:x.data?.status||null,endpoint:x.data?.endpoint_id||null
    }))
  }));
  console.log(JSON.stringify({
    chainId:7738577,serviceId:SERVICE,queryHeadBlock:headBlock.toString(),
    fallbackQuorumStatus:fallback?.status??'missing',
    verifiedReachableSigners:fallback?.reachable??0,
    rejectedObservationCount:fallback?.rejected??0,
    evidenceKeys:fallback?.evidenceKeys??[],
    activeByWallet,
    result:fallback?.status==='reachable'?'M5_2_OF_2_REACHABLE_QUORUM_CONFIRMED':'M5_QUORUM_NOT_YET_VERIFIED',
    checkedAt:new Date().toISOString()
  },null,2));
}
main().catch(e=>{console.error(JSON.stringify({result:'ERROR',error:e.message}));process.exitCode=1;});
