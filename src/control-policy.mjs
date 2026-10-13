import { normalizeAddress, selectTrustedManifest } from './policy.mjs';
const KEY=/^0x[a-fA-F0-9]{64}$/;
const ID=/^[a-z0-9][a-z0-9-_]{0,62}$/;

export function validateRevocation(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      data.schema_version !== 1 || !ID.test(data.service_id ?? '') ||
      !KEY.test(data.target_key ?? '') ||
      !['retired', 'compromised', 'incorrect'].includes(data.reason)) {
    throw new Error('Invalid revocation payload');
  }
  return { schema_version:1, service_id:data.service_id,
    target_key:data.target_key.toLowerCase(),reason:data.reason };
}
export function validateRotation(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      data.schema_version !== 1 || !ID.test(data.service_id ?? '') ||
      data.epoch !== 1 || !Number.isSafeInteger(data.min_revision) ||
      data.min_revision < 1) throw new Error('Invalid root rotation payload');
  return { schema_version:1,service_id:data.service_id,epoch:1,
    successor:normalizeAddress(data.successor),min_revision:data.min_revision };
}

/**
 * One-hop publisher rotation from an OUT-OF-BAND pinned root wallet.
 * Readers never honor untrusted claims about a root or successor.
 * Control entities must have the correct on-chain creator, typed attributes,
 * active block lifetime, and complete matching payload. Any conflicting root
 * rotations fail CLOSED. Multi-hop rotations are deliberately unsupported.
 *
 * Revoking the highest valid revision blocks recovery; it cannot silently fall
 * back to an older revision. Clients can persist a minimum seen revision/epoch
 * and revoked keys to resist rollback if an owner deletes a control entity.
 */
export function resolveServiceState(records,{pinnedPublisher,serviceId,headBlock,
  minRevision=0,minEpoch=0,rememberedRevocations=[]}={}){
  const root=normalizeAddress(pinnedPublisher);
  if(!ID.test(serviceId??'') || typeof headBlock!=='bigint')throw new Error('Invalid query context');
  if(!Number.isSafeInteger(minRevision)||minRevision<0||
    ![0,1].includes(minEpoch))throw new Error('Invalid monotonicity fence');
  const active=records.filter(rec=>typeof rec.expiresAt==='bigint'&&rec.expiresAt>headBlock);
  const matchesKind=(rec,kind)=>rec?.attributes?.kind?.type==='str' &&
    rec.attributes.kind.value===kind;
  const validContext=(rec,kind)=>{
    const a=rec.attributes;
    return KEY.test(rec.key??'')&&a?.project?.type==='str' &&
      a.project.value==='relayline-v1'&&matchesKind(rec,kind)&&
      a?.service_id?.type==='str'&&a.service_id.value===serviceId;
  };
  const rotations=active.filter(r=>matchesKind(r,'rotation') &&
    typeof r.creator==='string'&&r.creator.toLowerCase()===root);
  if(rotations.length>1)return {selected:null,issue:'conflicting_root_rotation',epoch:0,revokedKeys:[]};
  let signer=root, epoch=0, minCutover=0;
  if(rotations.length===1){
    try{
      const rec=rotations[0];
      if(!validContext(rec,'rotation')||rec.attributes?.epoch?.type!=='u64'||
        rec.attributes.epoch.value!==1n)throw new Error('invalid attributes');
      const data=validateRotation(rec.data);
      if(data.service_id!==serviceId || data.successor===root)throw new Error('invalid successor');
      signer=data.successor;epoch=1;minCutover=data.min_revision;
    }catch{return {selected:null,issue:'invalid_root_rotation',epoch:0,revokedKeys:[]};}
  }
  if(epoch<minEpoch)return {selected:null,issue:'publisher_rotation_rollback',epoch,revokedKeys:[]};
  const manifests=active.filter(r=>matchesKind(r,'manifest'));
  const decision=selectTrustedManifest(manifests,{
    pinnedPublisher:signer,serviceId,headBlock
  });
  if(!decision.selected)return {...decision,epoch,activeSigner:signer,revokedKeys:[]};
  const selected=decision.selected;
  if(selected.manifest.revision<Math.max(minRevision,minCutover)){
    return {...decision,selected:null,issue:'manifest_revision_rollback',epoch,activeSigner:signer,revokedKeys:[]};
  }
  const revocations=active.filter(r=>matchesKind(r,'revocation') &&
    typeof r.creator==='string' && r.creator.toLowerCase()===signer);
  const revoked=new Set(rememberedRevocations.filter(x=>typeof x==='string'&&KEY.test(x)).map(x=>x.toLowerCase()));
  for(const rec of revocations){
    try{
      if(!validContext(rec,'revocation')||rec.attributes?.target_key?.type!=='str') {
        throw new Error('bad attributes');
      }
      const rev=validateRevocation(rec.data);
      if(rev.service_id!==serviceId ||
        rev.target_key!==rec.attributes.target_key.value.toLowerCase())throw new Error('mismatch');
      revoked.add(rev.target_key);
    }catch{
      return {...decision,selected:null,issue:'invalid_publisher_revocation',
        epoch,activeSigner:signer,revokedKeys:[...revoked]};
    }
  }
  if(revoked.has(selected.key.toLowerCase())){
    return {...decision,selected:null,issue:'latest_manifest_revoked',
      epoch,activeSigner:signer,revokedKeys:[...revoked]};
  }
  return {...decision,epoch,activeSigner:signer,revokedKeys:[...revoked]};
}
