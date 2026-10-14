/**
 * M4/G3 independent verifier, NO signing wallet or secret.
 * Usage (all variables are PUBLIC testnet identifiers):
 * ATTACKER_ADDRESS=0x... ATTACKER_TX_HASH=0x... ATTACKER_ENTITY_KEY=0x... node scripts/verify-m4-impersonation.mjs
 */
import {publicClient} from '../src/arkiv.mjs';
import {queryServiceRecords} from '../src/query.mjs';
import {resolveServiceState} from '../src/control-policy.mjs';
import {normalizeAddress,validateManifest} from '../src/policy.mjs';

const ROOT='0x2d7cfff67d9e63e225e082371b205cb7518b5c24';
const LEGIT_KEY='0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc';
const SERVICE='relayline-demo-oct14';
const attacker=normalizeAddress(process.env.ATTACKER_ADDRESS);
const txHash=process.env.ATTACKER_TX_HASH;
const attackKey=process.env.ATTACKER_ENTITY_KEY;
function requireHex(name,v){if(typeof v!=='string'||!/^0x[a-f0-9]{64}$/i.test(v))throw Error('Missing/invalid public '+name);}
function eq(a,b){return typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();}
async function verify(){
  requireHex('transaction hash',txHash); requireHex('entity key',attackKey);
  if(eq(attacker,ROOT))throw Error('Attacker account must be different from pinned publisher');
  const client=publicClient();
  if(await client.getChainId()!==7738577)throw Error('Wrong Tiramisu chain');
  const receipt=await client.getTransactionReceipt({hash:txHash});
  if(receipt.status!=='success'||!eq(receipt.from,attacker))
    throw Error('G3 transaction failed or wallet does not match');
  const entity=await client.getEntity(attackKey);
  if(!entity||!eq(entity.key,attackKey)||!eq(entity.creator,attacker))
    throw Error('G3 on-chain creator or entity key mismatch');
  const manifest=validateManifest(entity.toJson(),{serviceId:SERVICE});
  if(entity.attributes?.project?.value!=='relayline-v1' ||
     entity.attributes?.kind?.value!=='manifest' ||
     entity.attributes?.service_id?.value!==SERVICE ||
     entity.attributes?.revision?.value!==BigInt(manifest.revision))
    throw Error('G3 typed entity attributes or revision mismatch');
  const {headBlock,entities}=await queryServiceRecords(client,SERVICE);
  const decision=resolveServiceState(entities,{pinnedPublisher:ROOT,serviceId:SERVICE,headBlock});
  if(!decision.selected||!eq(decision.selected.key,LEGIT_KEY))
    throw Error('G3 trusted manifest no longer selected: '+decision.issue);
  const rejected=decision.rejected?.find(item=>eq(item.key,attackKey));
  if(!rejected || rejected.reason!=='untrusted_creator')
    throw Error('G3 failed: counterfeit entity not explicitly rejected by immutable creator');
  console.log(JSON.stringify({
    result:'PASS',gate:'G3_REAL_IMPERSONATION_REJECTED',chainId:7738577,
    txBlock:receipt.blockNumber.toString(),
    attackerWallet:attacker,attackerEntityKey:attackKey,attackerTxHash:txHash,
    serviceId:SERVICE,attackerRevision:manifest.revision,
    pinnedRoot:ROOT,retainedLegitimateKey:decision.selected.key,
    attackerRejectedFor:rejected.reason,queryHeadBlock:headBlock.toString(),
    checkedAt:new Date().toISOString()
  },null,2));
}
verify().catch(e=>{console.error(JSON.stringify({result:'FAIL',gate:'G3_REAL_IMPERSONATION_REJECTED',error:e.message}));process.exitCode=1;});
