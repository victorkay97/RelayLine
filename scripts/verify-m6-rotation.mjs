/** One-time read-only verification of signed Wallet B -> C rotation.
 * Public identifiers only; no private keys or writes.
 */
import {publicClient} from '../src/arkiv.mjs';
import {queryServiceRecords} from '../src/query.mjs';
import {resolveServiceState,validateRotation} from '../src/control-policy.mjs';
const expected={
  chainId:7738577,
  service:'relayline-m6-oct18',
  root:'0x024e3989ff6ed673c90613815dca3017ab9ea50d',
  successor:'0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e',
  tx:'0x110deaa5d50fc93ed80158e3dae3e4614b877667d99664d0ad32e6c848810b8a',
  rotationKey:'0x250d41fb30aa27ca3c44ee77edd373ad177cedcab5e2a385f219f1586e7e0866',
  successorKey:'0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1'
};
const eq=(a,b)=>String(a??'').toLowerCase()===String(b??'');
function check(value,message){if(!value)throw Error(message)}
async function main(){
  const client=publicClient();
  check(await client.getChainId()===expected.chainId,'Unexpected chain');
  const receipt=await client.getTransactionReceipt({hash:expected.tx});
  check(receipt.status==='success','Rotation transaction failed');
  check(eq(receipt.from,expected.root),'Rotation transaction sender is not root Wallet B');
  const rotation=await client.getEntity(expected.rotationKey);
  check(rotation&&eq(rotation.key,expected.rotationKey),'Rotation entity missing');
  check(eq(rotation.creator,expected.root),'Rotation on-chain creator is not Wallet B');
  check(rotation.attributes?.project?.value==='relayline-v1','Wrong project');
  check(rotation.attributes?.service_id?.value===expected.service,'Wrong service');
  check(rotation.attributes?.kind?.type==='str'&&rotation.attributes.kind.value==='rotation','Wrong control kind');
  check(rotation.attributes?.epoch?.type==='u64'&&rotation.attributes.epoch.value===1n,'Wrong typed epoch');
  const payload=validateRotation(rotation.toJson());
  check(payload.service_id===expected.service,'Control payload service mismatch');
  check(eq(payload.successor,expected.successor),'Wrong successor address');
  check(payload.epoch===1&&payload.min_revision===2,'Unexpected rotation epoch/cutover');
  const {headBlock,entities}=await queryServiceRecords(client,expected.service);
  const decision=resolveServiceState(entities,{serviceId:expected.service,pinnedPublisher:expected.root,headBlock});
  check(decision.epoch===1,'Reader has not accepted epoch 1');
  check(!decision.issue,'Reader failed: '+decision.issue);
  check(eq(decision.activeSigner,expected.successor),'Reader did not select Wallet C');
  check(decision.selected&&eq(decision.selected.key,expected.successorKey),'Reader did not select exact successor revision 2');
  check(decision.selected.manifest.revision===2,'Reader selected wrong successor revision');
  console.log(JSON.stringify({
    result:'PASS',gate:'M6_ROOT_SIGNED_ROTATION_CONFIRMED',chainId:expected.chainId,
    rotationTransaction:expected.tx,rotationTransactionBlock:String(receipt.blockNumber),
    rotationKey:rotation.key,immutableCreator:rotation.creator,successor:payload.successor,
    minRevision:payload.min_revision,epoch:decision.epoch,
    readerActiveSigner:decision.activeSigner,readerSelectedEntity:decision.selected.key,
    readerSelectedRevision:decision.selected.manifest.revision,
    queryHeadBlock:String(headBlock),checkedAt:new Date().toISOString()
  },null,2));
}
main().catch(e=>{console.error(JSON.stringify({result:'FAIL',gate:'M6_ROOT_SIGNED_ROTATION_CONFIRMED',error:e.message},null,2));process.exitCode=1;});
