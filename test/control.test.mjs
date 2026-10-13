import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveServiceState,validateRevocation,validateRotation } from '../src/control-policy.mjs';
import { publishControl } from '../src/control-arkiv.mjs';
const ROOT='0x1111111111111111111111111111111111111111';
const NEXT='0x2222222222222222222222222222222222222222';
const ATTACKER='0x3333333333333333333333333333333333333333';
const KEY='0x'+'a'.repeat(64),KEY2='0x'+'b'.repeat(64);
const manifest=(revision=1)=>({schema_version:1,service_id:'demo',revision,
 endpoints:[{id:'main',role:'primary',url:'https://primary.example.org/'},
 {id:'backup',role:'fallback',url:'https://backup.example.org/'}]});
const a=(name,value,type='str')=>({type,value});
const attrs=(kind,extra={})=>({project:a('','relayline-v1'),kind:a('',kind),service_id:a('','demo'),...extra});
const entity=(key,creator,kind,data,extra={})=>({
 key,creator,createdAt:200n,expiresAt:900n,attributes:attrs(kind,extra),data
});
const m=(key=KEY,creator=ROOT,revision=1)=>entity(key,creator,'manifest',manifest(revision),
 {revision:a('',BigInt(revision),'u64')});
const rev=(key='0x'+'c'.repeat(64),creator=ROOT,target=KEY)=>entity(key,creator,'revocation',{
 schema_version:1,service_id:'demo',target_key:target,reason:'compromised'
},{target_key:a('',target)});
const rotation=(creator=ROOT,successor=NEXT)=>entity('0x'+'d'.repeat(64),creator,'rotation',{
 schema_version:1,service_id:'demo',successor,epoch:1,min_revision:2
},{epoch:a('',1n,'u64')});
const options={pinnedPublisher:ROOT,serviceId:'demo',headBlock:250n};

test('baseline pinned root recovers and returns epoch zero',()=>{
 const result=resolveServiceState([m()],options);
 assert.equal(result.selected.key,KEY);assert.equal(result.epoch,0);
});
test('legitimate root revocation blocks latest and does not fall back',()=>{
 const result=resolveServiceState([m(),rev(),m(KEY2,ROOT,0+2)],options);
 assert.equal(result.selected.key,KEY2);
 const blocked=resolveServiceState([m(),rev()],options);
 assert.equal(blocked.selected,null);assert.equal(blocked.issue,'latest_manifest_revoked');
});
test('attacker cannot revoke root manifest with forged payload',()=>{
 const bad=rev('0x'+'c'.repeat(64),ATTACKER);
 bad.data.claimedPublisher=ROOT;
 const result=resolveServiceState([m(),bad],options);
 assert.equal(result.selected.key,KEY);
});
test('out-of-band pinned root signs one-hop successor',()=>{
 const state=resolveServiceState([m(),rotation(),m(KEY2,NEXT,2)],options);
 assert.equal(state.selected.key,KEY2);
 assert.equal(state.activeSigner,NEXT);
 assert.equal(state.epoch,1);
});
test('forged or contradictory root rotation fails safe',()=>{
 const forged=resolveServiceState([m(),rotation(ATTACKER)],options);
 assert.equal(forged.selected.key,KEY);
 const conflict=resolveServiceState([m(),rotation(),{...rotation(),key:'0x'+'e'.repeat(64)}],options);
 assert.equal(conflict.issue,'conflicting_root_rotation');
 assert.equal(conflict.selected,null);
});
test('successor must meet minimum revision',()=>{
 const r=resolveServiceState([rotation(),m(KEY2,NEXT,1)],options);
 assert.equal(r.selected,null);assert.equal(r.issue,'manifest_revision_rollback');
});
test('stored monotonic epoch prevents rollback from removed rotation',()=>{
 const result=resolveServiceState([m()],{...options,minEpoch:1});
 assert.equal(result.issue,'publisher_rotation_rollback');
});
test('stored last seen revision prevents rollback',()=>{
 const result=resolveServiceState([m()],{...options,minRevision:2});
 assert.equal(result.issue,'manifest_revision_rollback');
});
test('locally remembered root revocation survives removed record',()=>{
 const r=resolveServiceState([m()],{...options,rememberedRevocations:[KEY]});
 assert.equal(r.issue,'latest_manifest_revoked');
});
test('expired rotation does not grant authority',()=>{
 const stale={...rotation(),expiresAt:250n};
 const result=resolveServiceState([m(),stale,m(KEY2,NEXT,2)],options);
 assert.equal(result.selected.key,KEY);
});
test('reject invalid control schema before signing',()=>{
 assert.throws(()=>validateRotation({schema_version:1,service_id:'demo',epoch:2,successor:NEXT,min_revision:2}),/Invalid/);
 assert.throws(()=>validateRevocation({schema_version:1,service_id:'demo',target_key:KEY,reason:'anything'}),/Invalid/);
});
test('control write validates creator and encodes readonly payload',async()=>{
 let written;
 const wallet={account:{address:ROOT},createEntity:async props=>{
   written=props;return {entityKey:KEY2,txHash:'0x'+'f'.repeat(64)};
 }};
 const result=await publishControl({publicClient:{getChainId:async()=>7738577},walletClient:wallet,
  account:ROOT,kind:'revocation',data:{schema_version:1,service_id:'demo',target_key:KEY,reason:'retired'}});
 assert.equal(result.kind,'revocation');
 assert.equal(written.attributes.kind.value,'revocation');
 assert.equal(written.flags.readonly,true);
});
