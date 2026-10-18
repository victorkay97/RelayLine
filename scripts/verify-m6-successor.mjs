/** Read-only M6 successor transaction / pre-rotation policy verification.
 * Do not use private keys and do not submit transactions.
 */
import {publicClient} from '../src/arkiv.mjs';
import {queryServiceRecords} from '../src/query.mjs';
import {resolveServiceState} from '../src/control-policy.mjs';
import {validateManifest} from '../src/policy.mjs';
const exp={
  root:'0x024e3989ff6ed673c90613815dca3017ab9ea50d',
  successor:'0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e',
  service:'relayline-m6-oct18',
  rootKey:'0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91',
  key:'0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1',
  tx:'0x6a25114101fa702d0514c97fb5310ef67e3ad8a56360e0093e49a7e88c959148',
  primary:'https://relayline-test-primary.vercel.app/',
  fallback:'https://relayline-test-fallback.vercel.app/'
};
const eq=(a,b)=>String(a??'').toLowerCase()===String(b??'');
const check=(value,message)=>{if(!value)throw Error(message)};
async function main(){
  const client=publicClient();
  check(await client.getChainId()===7738577,'Unexpected network');
  const receipt=await client.getTransactionReceipt({hash:exp.tx});
  check(receipt.status==='success','Successor transaction failed');
  check(eq(receipt.from,exp.successor),'Receipt sender differs from Wallet C');
  const entity=await client.getEntity(exp.key);
  check(entity&&eq(entity.key,exp.key),'Successor entity not found');
  check(eq(entity.creator,exp.successor),'Immutable on-chain creator mismatch');
  check(entity.attributes?.kind?.type==='str'&&entity.attributes.kind.value==='manifest','Wrong kind');
  check(entity.attributes?.project?.value==='relayline-v1','Wrong project');
  check(entity.attributes?.service_id?.value===exp.service,'Wrong service attribute');
  check(entity.attributes?.revision?.value===2n,'Wrong revision attribute');
  const manifest=validateManifest(entity.toJson());
  check(manifest.service_id===exp.service&&manifest.revision===2,'Wrong manifest service/revision');
  check(manifest.endpoints.find(x=>x.role==='primary')?.url===exp.primary,'Wrong primary endpoint');
  check(manifest.endpoints.find(x=>x.role==='fallback')?.url===exp.fallback,'Wrong fallback endpoint');
  const {entities,headBlock}=await queryServiceRecords(client,exp.service);
  const r=resolveServiceState(entities,{pinnedPublisher:exp.root,serviceId:exp.service,headBlock});
  check(r.epoch===0,'Unexpected active rotation; STOP before signing any root control');
  check(r.selected&&eq(r.selected.key,exp.rootKey),'Root manifest not selected before rotation: '+r.issue);
  const rejected=r.rejected?.find(x=>eq(x.key,exp.key));
  check(rejected?.reason==='untrusted_creator','Unsigned successor unexpectedly trusted or omitted: '+rejected?.reason);
  console.log(JSON.stringify({
    result:'PASS',gate:'M6_SUCCESSOR_READY_PRE_ROTATION',chainId:7738577,
    txHash:exp.tx,transactionBlock:String(receipt.blockNumber),
    successor:entity.creator,successorEntityKey:entity.key,revision:manifest.revision,
    successorExpiresAtBlock:String(entity.expiresAt),
    rootPublisher:exp.root,rootEntityStillSelected:r.selected.key,
    rotationEpoch:r.epoch,successorRejectionBeforeRotation:rejected.reason,
    queryHeadBlock:String(headBlock),checkedAt:new Date().toISOString()
  },null,2));
}
main().catch(error=>{console.error(JSON.stringify({result:'FAIL',gate:'M6_SUCCESSOR_READY_PRE_ROTATION',error:error.message},null,2));process.exitCode=1});
