/** Live M4 G4: signed Arkiv manifest + actual controlled primary HTTP outage.
 * Strict exact URL allowlist: NEVER use untrusted manifest URLs as generic CI probes.
 */
import { readServiceRecords } from '../src/arkiv.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
import { chooseRecovery } from '../src/policy.mjs';

const serviceId='relayline-demo-oct14';
const publisher='0x2d7cfff67d9e63e225e082371b205cb7518b5c24';
const expectedKey='0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc';
const expectedUrls={
  primary:'https://relayline-test-primary.vercel.app/',
  fallback:'https://relayline-test-fallback.vercel.app/'
};
async function run(){
  const {headBlock,entities}=await readServiceRecords(serviceId);
  const result=resolveServiceState(entities,{pinnedPublisher:publisher,serviceId,headBlock});
  if (!result.selected)throw Error('No trusted active manifest: '+result.issue);
  if (result.selected.key.toLowerCase()!==expectedKey)throw Error('Selected unexpected Arkiv entity key');
  const endpoints=result.selected.manifest.endpoints;
  if (endpoints.length!==2 ||
      endpoints.find(e=>e.role==='primary')?.url!==expectedUrls.primary ||
      endpoints.find(e=>e.role==='fallback')?.url!==expectedUrls.fallback) {
    throw Error('On-chain URLs do not match explicitly allowlisted controlled test domains');
  }
  const recovery=await chooseRecovery(result.selected.manifest);
  if (recovery.result!=='recovered' || recovery.url!==expectedUrls.fallback)
    throw Error('Recovery failed: '+JSON.stringify(recovery));
  if(recovery.probes.length!==2 ||
     recovery.probes[0].httpStatus!==404 ||
     recovery.probes[1].httpStatus!==200){
    throw Error('Unexpected probe statuses: '+JSON.stringify(recovery.probes));
  }
  console.log(JSON.stringify({result:'PASS',gate:'G4_CONTROLLED_ONCHAIN_RECOVERY',
    serviceId,pinnedPublisher:publisher,
    selectedEntityKey:result.selected.key,
    queryHeadBlock:headBlock.toString(),
    primaryHttpStatus:recovery.probes[0].httpStatus,
    fallbackHttpStatus:recovery.probes[1].httpStatus,
    selectedUrl:recovery.url,
    noRelayLineAppBackendUsed:true,
    note:'Demonstrates recovery during a controlled HTTP 404 outage, not proof of actual censorship.',
    checkedAt:new Date().toISOString()
  },null,2));
}
run().catch(error=>{console.error(JSON.stringify({result:'FAIL',gate:'G4_CONTROLLED_ONCHAIN_RECOVERY',error:error.message,checkedAt:new Date().toISOString()}));process.exitCode=1;});
