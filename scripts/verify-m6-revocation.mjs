/** M6 final read-only Tiramisu proof: successor-signed revocation blocks recovery.
 * All identifiers are PUBLIC. Never requires private keys or writes to chain.
 */
import {publicClient} from '../src/arkiv.mjs';
import {queryServiceRecords} from '../src/query.mjs';
import {resolveServiceState,validateRevocation} from '../src/control-policy.mjs';
const expected={
  chainId:7738577, service:'relayline-m6-oct18',
  root:'0x024e3989ff6ed673c90613815dca3017ab9ea50d',
  signer:'0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e',
  tx:'0x4ed2e6e916d4d3f16960d02d7080f5da6d526657032a95349ecd706c089a5444',
  revocationKey:'0x6b9c0e7fa75056b1f320778a208021f3a05be052d62cf695f24fdf7fd3a697a1',
  targetKey:'0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1',
  originalKey:'0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91',
  rotationKey:'0x250d41fb30aa27ca3c44ee77edd373ad177cedcab5e2a385f219f1586e7e0866'
};
const equal=(a,b)=>String(a??'').toLowerCase()===String(b??'');
function assert(ok,message){if(!ok)throw Error(message);}
async function main(){
  const client=publicClient();
  assert(await client.getChainId()===expected.chainId,'Wrong network chain ID');
  const receipt=await client.getTransactionReceipt({hash:expected.tx});
  assert(receipt.status==='success','Revocation transaction not successful');
  assert(equal(receipt.from,expected.signer),'Revocation transaction not signed by successor Wallet C');
  const rev=await client.getEntity(expected.revocationKey);
  assert(rev&&equal(rev.key,expected.revocationKey),'Revocation entity absent or mismatched');
  assert(equal(rev.creator,expected.signer),'Revocation immutable on-chain creator mismatch');
  assert(rev.attributes?.kind?.type==='str'&&rev.attributes.kind.value==='revocation','Control kind mismatch');
  assert(rev.attributes?.project?.type==='str'&&rev.attributes.project.value==='relayline-v1','Wrong project');
  assert(rev.attributes?.service_id?.type==='str'&&rev.attributes.service_id.value===expected.service,'Wrong service');
  assert(rev.attributes?.target_key?.type==='str'&&equal(rev.attributes.target_key.value,expected.targetKey),'Target attribute mismatch');
  const payload=validateRevocation(rev.toJson());
  assert(payload.service_id===expected.service&&equal(payload.target_key,expected.targetKey),'Invalid signed payload target');
  assert(payload.reason==='retired','Unexpected revocation reason');
  const {headBlock,entities}=await queryServiceRecords(client,expected.service);
  const rotation=entities.find(e=>equal(e.key,expected.rotationKey));
  assert(rotation&&equal(rotation.creator,expected.root),'Expected root-signed rotation not visible');
  const decision=resolveServiceState(entities,{pinnedPublisher:expected.root,serviceId:expected.service,headBlock});
  assert(decision.epoch===1,'No authorized rotation epoch 1');
  assert(equal(decision.activeSigner,expected.signer),'Reader no longer recognizes Wallet C as active signer');
  assert(decision.issue==='latest_manifest_revoked','Reader did not fail closed on revoked highest revision: '+decision.issue);
  assert(decision.selected===null,'Reader incorrectly selected an older or revoked manifest');
  assert(decision.revokedKeys.some(key=>equal(key,expected.targetKey)),'Revocation target not recognized by reader');
  const original=decision.rejected?.find(e=>equal(e.key,expected.originalKey));
  assert(original?.reason==='untrusted_creator','Original root manifest should not be selected after rotation');
  console.log(JSON.stringify({
    result:'PASS',gate:'M6_LIVE_SUCCESSOR_REVOKED_FAIL_CLOSED',chainId:expected.chainId,
    revocationTransaction:expected.tx,transactionBlock:String(receipt.blockNumber),
    revocationEntityKey:rev.key,immutableCreator:rev.creator,
    targetManifest:payload.target_key,reason:payload.reason,
    selected:decision.selected,readerIssue:decision.issue,
    readerEpoch:decision.epoch,readerActiveSigner:decision.activeSigner,
    readerRevokedKeys:decision.revokedKeys,oldRootManifestRejectedFor:original.reason,
    queryHeadBlock:String(headBlock),checkedAt:new Date().toISOString(),
    note:'This is a disposable test service; revocation prevents recovery at observed snapshot, not a guarantee of irreversible deletion resistance.'
  },null,2));
}
main().catch(error=>{console.error(JSON.stringify({
  result:'FAIL',gate:'M6_LIVE_SUCCESSOR_REVOKED_FAIL_CLOSED',
  error:error.message,checkedAt:new Date().toISOString()
},null,2));process.exitCode=1;});
