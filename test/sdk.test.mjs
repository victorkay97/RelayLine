import test from 'node:test';
import assert from 'node:assert/strict';
import { readAuthorizedService } from '../src/reader-sdk.mjs';
const wallet='0x1111111111111111111111111111111111111111';
test('third-party reader uses only injected public client and returns authorized manifest',async()=>{
  const manifest={
    schema_version:1,service_id:'example',revision:1,endpoints:[
      {id:'main',role:'primary',url:'https://primary.example.org/'},
      {id:'backup',role:'fallback',url:'https://backup.example.org/'}
    ]
  };
  const entity={
    key:'0x'+'a'.repeat(64),creator:wallet,createdAt:10n,expiresAt:500n,
    attributes:{
      project:{type:'str',value:'relayline-v1'},
      kind:{type:'str',value:'manifest'},
      service_id:{type:'str',value:'example'},
      revision:{type:'u64',value:1n}
    },
    toJson:()=>manifest
  };
  const page={blockNumber:20n,entities:[entity],hasNextPage:()=>false};
  const builder={where(){return this;},limit(){return this;},fetch:async()=>page};
  const client={getChainId:async()=>7738577,select:()=>builder};
  const state=await readAuthorizedService({client,serviceId:'example',pinnedPublisher:wallet});
  assert.equal(state.independentlyQueryable,true);
  assert.equal(state.decision.selected.key,entity.key);
  assert.equal(state.monitorResults[0].status,'not_configured');
});
