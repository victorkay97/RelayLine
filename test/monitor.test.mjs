import test from 'node:test';
import assert from 'node:assert/strict';
import { validateObservation, evaluateMonitorEvidence } from '../src/monitor-policy.mjs';
import { publishObservation } from '../src/monitor-arkiv.mjs';
import { isPublicIPv4, monitorProbe } from '../src/monitor-probe.mjs';

const creator = '0x1111111111111111111111111111111111111111';
const other = '0x2222222222222222222222222222222222222222';
const bad = '0x3333333333333333333333333333333333333333';
const key = '0x' + 'a'.repeat(64);
const manifest = {
  schema_version: 1, service_id: 'demo', revision: 1,
  endpoints: [{ id: 'main', role: 'primary', url: 'https://primary.example.org/' },
    { id: 'backup', role: 'fallback', url: 'https://backup.example.org/' }]
};
const nowMs = 1800000000000;
const data = (endpoint='main', status='reachable') => ({
  schema_version: 1, service_id: 'demo', manifest_key: key,
  endpoint_id: endpoint, endpoint_url: manifest.endpoints.find(x=>x.id===endpoint).url,
  status, observed_at_ms: nowMs, http_status: status==='reachable'?200:503
});
const record = (id, signer, observation, createdAt=100n, expiresAt=900n) => ({
  key: '0x'+id.repeat(64), creator: signer, createdAt, expiresAt,
  attributes: {
    project: {type:'str',value:'relayline-v1'}, kind: {type:'str',value:'observation'},
    service_id: {type:'str',value:'demo'}
  },
  data: observation
});
const options = { manifest, manifestKey:key, headBlock:200n, nowMs,
  trustedMonitorWallets:[creator,other], quorum:2 };

test('two independently signed agreeing observations reach quorum', () => {
  const result=evaluateMonitorEvidence([record('b',creator,data()),record('c',other,data())],options);
  assert.equal(result[0].status,'reachable');
  assert.equal(result[1].status,'unknown');
});
test('contradicting honest monitors display disputed, not green',()=>{
  const result=evaluateMonitorEvidence([record('b',creator,data()),record('c',other,data('main','unreachable'))],options);
  assert.equal(result[0].status,'disputed');
});
test('spoofed claimed monitor is rejected by actual creator',()=>{
  const forged=record('b',bad,{...data(), claimed_monitor:creator});
  const result=evaluateMonitorEvidence([forged,record('c',creator,data())],options);
  assert.equal(result[0].status,'unknown');
  assert.equal(result[0].reachable,1);
});
test('outdated, expired and wrong-manifest reports do not count',()=>{
  const expired=record('b',creator,data(),100n,200n);
  const different=record('c',other,{...data(),manifest_key:'0x'+'f'.repeat(64)});
  const result=evaluateMonitorEvidence([expired,different],options);
  assert.equal(result[0].status,'unknown');
  assert.equal(result[0].trustedSources,0);
});
test('no configured monitor wallets never reports health',()=>{
  const result=evaluateMonitorEvidence([record('b',creator,data())],{...options,trustedMonitorWallets:[]});
  assert.equal(result[0].status,'not_configured');
});
test('same-wallet contradictory equal-block evidence is excluded',()=>{
  const result=evaluateMonitorEvidence([
    record('b',creator,data()),record('c',creator,data('main','unreachable'),100n),
    record('d',other,data())
  ],options);
  assert.equal(result[0].status,'unknown');
});
test('observation timestamp is strictly bounded',()=>{
  assert.throws(()=>validateObservation({...data(),observed_at_ms:nowMs-16*60*1000},{nowMs}),/stale/);
  assert.throws(()=>validateObservation({...data(),observed_at_ms:nowMs+61000},{nowMs}),/future/);
});
test('monitor write checks wallet and emits 10-minute expiring entity',async()=>{
  let written;
  const wallet={account:{address:creator},createEntity:async params=> {
    written=params;return {entityKey:key,txHash:'0x'+'d'.repeat(64)};
  }};
  const receipt=await publishObservation({
    publicClient:{getChainId:async()=>7738577},walletClient:wallet,account:creator,
    observation:data(),nowMs
  });
  assert.equal(receipt.creator,creator);
  assert.equal(written.attributes.kind.value,'observation');
  assert.equal(written.flags.permissionlessExtension,false);
  assert.equal(written.contentType,'application/json');
});
test('monitor SSRF guard blocks private ranges and unapproved URLs',async()=>{
  for(const ip of ['10.0.0.1','127.0.0.1','172.16.0.1','192.168.1.9','169.254.169.254','100.100.100.100']){
    assert.equal(isPublicIPv4(ip),false,ip);
  }
  assert.equal(isPublicIPv4('8.8.8.8'),true);
  await assert.rejects(()=>monitorProbe('https://unapproved.example.org/',{
    approvedUrls:['https://primary.example.org/']
  }),/allowlist/);
  await assert.rejects(()=>monitorProbe('https://127.0.0.1/',{
    approvedUrls:['https://127.0.0.1/']
  }),/IP-literal/);
});
test('DNS to private target is refused before outgoing HTTPS request',async()=>{
  let called=false;
  await assert.rejects(()=>monitorProbe('https://primary.example.org/',{
    approvedUrls:['https://primary.example.org/'],
    resolve: async()=>[{address:'169.254.169.254',family:4}],
    requestImpl:()=>{called=true;throw new Error('must not call')}
  }),/not entirely public/);
  assert.equal(called,false);
});

test('monitor DNS pinning handles Node 22 all:true and scalar lookup shapes',async()=>{
  const url='https://primary.example.org/';
  const result=await monitorProbe(url,{
    approvedUrls:[url],
    resolve:async()=>[{address:'8.8.8.8',family:4}],
    requestImpl:(_url,options,onResponse)=>{
      options.lookup('primary.example.org',{all:true},(error,answers)=>{
        assert.equal(error,null);
        assert.deepEqual(answers,[{address:'8.8.8.8',family:4}]);
      });
      options.lookup('primary.example.org',{all:false},(error,address,family)=>{
        assert.equal(error,null);
        assert.equal(address,'8.8.8.8');
        assert.equal(family,4);
      });
      return {on(){return this;},end(){onResponse({statusCode:200,resume(){}});}};
    }
  });
  assert.deepEqual(result,{status:'reachable',http_status:200});
});
