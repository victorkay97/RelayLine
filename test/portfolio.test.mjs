import test from 'node:test';
import assert from 'node:assert/strict';
import {queryPublisherPortfolio} from '../src/portfolio.mjs';

const walletA='0x1111111111111111111111111111111111111111';
function fakeClient({pages,chain=7738577}){
 let whereArgs=null,requestedCreator=null,limit=null,p=0;
 const context={
   where(...x){whereArgs=x;return this;},
   createdBy(address){requestedCreator=address;return this;},
   limit(n){limit=n;return this;},
   fetch(){return pages[0]}
 };
 const client={getChainId:async()=>chain,select:()=>context};
 return {client,read:()=>({whereArgs,requestedCreator,limit})};
}
const record=(key='0x'+'a'.repeat(64))=>({key,creator:walletA,createdAt:15n,expiresAt:500n,attributes:{},toJson:()=>({schema_version:1,service_id:'demo'})});

test('wallet portfolio queries immutable createdBy and typed attrs, no signer required',async()=>{
 const pages=[{blockNumber:200n,entities:[record()],hasNextPage:()=>false}];
 const {client,read}=fakeClient({pages});
 const result=await queryPublisherPortfolio(client,walletA);
 assert.equal(result.records.length,1);
 assert.equal(result.headBlock,200n);
 assert.equal(read().requestedCreator,walletA);
 assert.equal(read().limit,200);
 assert.equal(read().whereArgs.length,2);
 assert.equal(read().whereArgs[0].value?.value||read().whereArgs[0].value,'relayline-v1');
});

test('wallet portfolio rejects bad wallet and wrong chain',async()=>{
 await assert.rejects(queryPublisherPortfolio({getChainId:async()=>7738577},'not-a-wallet'),/Invalid pinned wallet/);
 await assert.rejects(queryPublisherPortfolio({getChainId:async()=>1},walletA),/Expected Arkiv Tiramisu/);
});

test('wallet portfolio refuses unsafe incomplete pagination snapshot',async()=>{
 const pages=[
   {blockNumber:10n,entities:[record()],hasNextPage:()=>true,
    next:async()=>pages[1]},
   {blockNumber:11n,entities:[record('0x'+'b'.repeat(64))],hasNextPage:()=>false}
 ];
 const {client}=fakeClient({pages});
 await assert.rejects(queryPublisherPortfolio(client,walletA),/snapshot between pages/);
});
