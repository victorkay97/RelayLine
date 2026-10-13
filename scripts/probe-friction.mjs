// Read-only SDK behavior probe for a reproducible, factual friction report.
// No writer wallet, private keys, payload data, or third-party entity contents.
import {publicClient} from '../src/arkiv.mjs';
import {str} from '@arkiv-network/sdk/attr';
import {eq} from '@arkiv-network/sdk/query';
import {readFile} from 'node:fs/promises';
const dummyWallet='0x1111111111111111111111111111111111111111';
const sdkVersion=JSON.parse(await readFile('node_modules/@arkiv-network/sdk/package.json','utf8')).version;
const start=Date.now();
try{
 const client=publicClient();
 const chain=await client.getChainId();
 if(chain!==7738577)throw Error('Wrong Arkiv chain');
 const first=await client.select({key:true,creator:true,expiresAt:true})
   .where(eq('project',str('relayline-v1')),eq('service_id',str('ci-observation-probe')))
   .limit(2).fetch();
 const firstBlock=first.blockNumber;
 if(typeof firstBlock!=='bigint'||!Array.isArray(first.entities))throw Error('Invalid query page');
 const signerFiltered=await client.select({key:true,creator:true,expiresAt:true})
   .where(eq('project',str('relayline-v1')),eq('service_id',str('ci-observation-probe')))
   .createdBy(dummyWallet).limit(2).fetch();
 const creatorSafe=signerFiltered.entities.every(x=>x.creator?.toLowerCase()===dummyWallet);
 if(!creatorSafe)throw Error('createdBy returned a mismatched immutable creator');
 console.log(JSON.stringify({
   result:'PASS',case:'sdk_readonly_typed_compound_and_createdBy',
   sdkVersion,chainId:chain,firstBlock:firstBlock.toString(),
   firstResultCount:first.entities.length,hasNextPage:first.hasNextPage(),
   creatorFilteredCount:signerFiltered.entities.length,creatorFilterMatches:creatorSafe,
   durationMs:Date.now()-start,checkedAt:new Date().toISOString()
 },null,2));
}catch(e){
 console.error(JSON.stringify({
   result:'FAIL',case:'sdk_readonly_typed_compound_and_createdBy',
   sdkVersion,error:e.message,checkedAt:new Date().toISOString()
 },null,2));
 process.exitCode=1;
}
