import test from 'node:test';
import assert from 'node:assert/strict';
import { queryServiceRecords } from '../src/query.mjs';
test('all-kinds query omits kind filter so root controls and manifests share snapshot',async()=>{
 const conditions=[];
 const builder={where(...args){conditions.push(args.length);return this;},
  limit(){return this;},async fetch(){return {blockNumber:50n,entities:[],hasNextPage:()=>false};}};
 const client={getChainId:async()=>7738577,select:()=>builder};
 const r=await queryServiceRecords(client,'service-id');
 assert.equal(r.headBlock,50n);assert.deepEqual(conditions,[2]);
});
test('specific-kind query applies the additional kind predicate',async()=>{
 const conditions=[];
 const builder={where(...args){conditions.push(args.length);return this;},
  limit(){return this;},async fetch(){return {blockNumber:50n,entities:[],hasNextPage:()=>false};}};
 const client={getChainId:async()=>7738577,select:()=>builder};
 await queryServiceRecords(client,'service-id',{kind:'observation'});
 assert.deepEqual(conditions,[2,1]);
});
