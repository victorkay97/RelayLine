/**
 * Offline, reproducible Arkiv contract/security presentation fixture.
 * NO Arkiv transaction is created. Never portray these synthetic entities
 * as live on-chain evidence. Wallet public keys here are illustrative.
 */
import { createServer } from 'node:http';
import { selectTrustedManifest, chooseRecovery } from '../src/policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
import { evaluateMonitorEvidence } from '../src/monitor-policy.mjs';

const ROOT='0x1111111111111111111111111111111111111111';
const ATTACKER='0x2222222222222222222222222222222222222222';
const MON1='0x3333333333333333333333333333333333333333';
const MON2='0x4444444444444444444444444444444444444444';
const KEY='0x'+'a'.repeat(64);
const now=Date.now();
const attr=(value,type='str')=>({type,value});
const base=kind=>({
 project:attr('relayline-v1'), kind:attr(kind), service_id:attr('judge-fixture')
});
const server=createServer((_req,res)=>{res.writeHead(200);res.end('RECOVERY SERVICE ONLINE');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const manifest={
    schema_version:1,service_id:'judge-fixture',revision:1,
    endpoints:[
      {id:'main',role:'primary',url:'http://127.0.0.1:1/'},
      {id:'backup',role:'fallback',url:'http://127.0.0.1:'+server.address().port+'/'}
    ]
  };
  const forged={...manifest,revision:999,claimed_publisher:ROOT};
  const wrap=(key,creator,kind,data,add={})=>({
    key,creator,createdAt:100n,expiresAt:900n,
    attributes:{...base(kind),...add},data
  });
  const legitimate=wrap(KEY,ROOT,'manifest',manifest,{revision:attr(1n,'u64')});
  const impersonator=wrap('0x'+'b'.repeat(64),ATTACKER,'manifest',forged,{revision:attr(999n,'u64')});
  const decision=selectTrustedManifest([legitimate,impersonator],{
    pinnedPublisher:ROOT,serviceId:'judge-fixture',headBlock:250n,allowLoopback:true
  });
  if(decision.selected?.key!==KEY||!decision.rejected.some(x=>x.reason==='untrusted_creator')){
    throw Error('Trust fixture failed');
  }
  const recovery=await chooseRecovery(decision.selected.manifest);
  if(recovery.result!=='recovered')throw Error('Fallback fixture failed');
  const observations=[MON1,MON2].map((creator,i)=>wrap('0x'+String(i+5).repeat(64),
    creator,'observation',{
    schema_version:1,service_id:'judge-fixture',manifest_key:KEY,
    endpoint_id:'backup',endpoint_url:manifest.endpoints[1].url,
    status:'reachable',observed_at_ms:now,http_status:200
  }));
  // The monitor policy intentionally disallows loopback HTTP endpoints;
  // therefore we demonstrate monitoring separately with a public synthetic URL.
  const healthy={
    ...manifest,
    endpoints:[{id:'main',role:'primary',url:'https://primary.example.org/'},
      {id:'backup',role:'fallback',url:'https://backup.example.org/'}]
  };
  const monitorRecords=observations.map((r,i)=>({
    ...r,data:{...r.data,endpoint_url:'https://backup.example.org/'},
    key:'0x'+String(i+5).repeat(64)
  }));
  const monitorEvidence=evaluateMonitorEvidence(monitorRecords,{
    manifest:healthy,manifestKey:KEY,headBlock:250n,nowMs:now,
    trustedMonitorWallets:[MON1,MON2],quorum:2
  });
  if(monitorEvidence[1].status!=='reachable')throw Error('Monitor quorum fixture failed');
  const rev=wrap('0x'+'c'.repeat(64),ROOT,'revocation',{
    schema_version:1,service_id:'judge-fixture',target_key:KEY,reason:'retired'
  },{target_key:attr(KEY)});
  // Controls check HTTPS-only manifests; this standalone revocation demo uses healthy.
  const live=wrap(KEY,ROOT,'manifest',healthy,{revision:attr(1n,'u64')});
  const revoked=resolveServiceState([live,rev],{
    pinnedPublisher:ROOT,serviceId:'judge-fixture',headBlock:250n
  });
  if(revoked.issue!=='latest_manifest_revoked')throw Error('Revocation fixture failed: '+revoked.issue);
  console.log(JSON.stringify({
    mode:'OFFLINE_SIMULATION_NOT_LIVE_ARKIV',
    chainTransactionHashes:[],
    results:{
      attackerWalletRejected:true,
      trustedPublisherWallet:ROOT,
      intentionallyDisabledPrimary:true,
      independentlyReachableFallback:recovery.url,
      twoMonitorQuorum:monitorEvidence[1].status,
      signedRevocationPolicy:revoked.issue
    }
  },null,2));
}finally{
  await new Promise(resolve=>server.close(resolve));
}
