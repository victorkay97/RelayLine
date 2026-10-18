import { publicClient } from '../src/arkiv.mjs';
import { queryPublisherPortfolio } from '../src/portfolio.mjs';
import { validateManifest } from '../src/policy.mjs';
const address='0x024e3989ff6ed673c90613815dca3017ab9ea50d';
const targetKey='0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91';
const {headBlock,records}=await queryPublisherPortfolio(publicClient(),address);
if(!records.some(r=>r.key?.toLowerCase()===targetKey))throw Error('Root Wallet B M6 published entity missing from portfolio');
if(records.some(r=>r.creator?.toLowerCase()!==address))throw Error('Creator filter exposed a different signer');
for(const r of records)validateManifest(r.data);
console.log(JSON.stringify({
 result:'PASS',gate:'WORKSPACE_LIVE_CREATOR_PORTFOLIO',creator:address,
 headBlock:String(headBlock),records:records.length,
 m6RootEntityFound:true,
 serviceIds:[...new Set(records.map(r=>r.data?.service_id))].sort(),
 note:'Current ACTIVE manifest query; not an exhaustive historical archive.'
},null,2));
