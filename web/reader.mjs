import { paintIcons, byId, escapeHtml, status, short, switchBusy, describeError, copyText } from './foundation.mjs';
import './dialog.css';
import { readPublicServiceRecords } from '../src/browser-arkiv.mjs';
import { normalizeAddress } from '../src/policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
import { evaluateMonitorEvidence } from '../src/monitor-policy.mjs';

const $ = byId;
const serviceInput = $('recovery-service');
const publisherInput = $('recovery-publisher');
const queryButton = $('query-service');
const notice = $('recovery-status');
const resultBox = $('recovery-result');
const trustNotice = $('pin-status');
const params = new URLSearchParams(location.search);
serviceInput.value = params.get('service') ?? '';
publisherInput.value = params.get('publisher') ?? '';

const allowedService = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const allowedEntity = /^0x[a-fA-F0-9]{64}$/;

const dialog = document.createElement('dialog');
dialog.className = 'app-dialog';
dialog.setAttribute('aria-labelledby','trust-dialog-title');
dialog.setAttribute('aria-describedby','trust-dialog-description');
dialog.innerHTML = `<div class="dialog-inner"><div class="dialog-icon"><i data-lucide="shield-alert"></i></div>
  <h2 id="trust-dialog-title">Confirm your trusted source</h2>
  <p id="trust-dialog-description"></p><code id="trust-dialog-value" class="dialog-wallet"></code>
  <div class="dialog-actions"><button type="button" class="btn btn-quiet" id="cancel-trust">Go back</button>
  <button type="button" class="btn btn-primary" id="confirm-trust">Confirm</button></div></div>`;
document.body.appendChild(dialog);
// The dialog is injected after the shared icon bootstrap; paint its icon now.
paintIcons();
const confirmButton = dialog.querySelector('#confirm-trust');
const cancelButton = dialog.querySelector('#cancel-trust');
let confirmedAction = null;
dialog.addEventListener('close', () => { confirmedAction = null; });
cancelButton.addEventListener('click', () => dialog.close());
confirmButton.addEventListener('click', () => {
  if (typeof confirmedAction === 'function') confirmedAction();
  dialog.close();
});
function requestConfirmation({title,description,value,action,label}){
  dialog.querySelector('#trust-dialog-title').textContent = title;
  dialog.querySelector('#trust-dialog-description').textContent = description;
  dialog.querySelector('#trust-dialog-value').textContent = value;
  confirmButton.textContent = label;
  confirmedAction = action;
  dialog.showModal();
  paintIcons();
}

const pinKey = id => 'relayline:v1:pinned:' + id;
const fenceKey = id => 'relayline:v1:fence:' + id;
function tryStorage(action){
  try {return action();} catch {throw Error('This browser cannot save trusted identities. Enable local storage or use another browser before verifying recovery addresses.');}
}
function currentId(){
  const id = serviceInput.value.trim().toLowerCase();
  if (!allowedService.test(id)) throw Error('Enter a valid service ID (lowercase letters, numbers, dashes or underscores).');
  return id;
}
function getPin(id=currentId()){
  return tryStorage(()=>localStorage.getItem(pinKey(id)));
}
function readFence(id){
  try {
    const raw = JSON.parse(tryStorage(()=>localStorage.getItem(fenceKey(id))) || '{}');
    return {
      minRevision: Number.isSafeInteger(raw.minRevision) && raw.minRevision>=0?raw.minRevision:0,
      minEpoch: raw.minEpoch===1?1:0,
      rememberedRevocations: Array.isArray(raw.revoked)?
        raw.revoked.filter(x=>typeof x==='string'&&allowedEntity.test(x)).slice(0,200):[]
    };
  } catch {
    return {minRevision:0,minEpoch:0,rememberedRevocations:[]};
  }
}
function updateFence(id,current,decision){
  const newState={
    minRevision:Math.max(current.minRevision,decision.selected?.manifest?.revision??0),
    minEpoch:Math.max(current.minEpoch,decision.epoch??0),
    revoked:[...new Set([...current.rememberedRevocations,...(decision.revokedKeys??[])])].slice(-200)
  };
  tryStorage(()=>localStorage.setItem(fenceKey(id),JSON.stringify(newState)));
}
function refreshTrust(){
  try {
    const id=currentId();
    const pin=getPin(id);
    if (!pin) {
      status(trustNotice,'No publisher pinned in this browser. Verify the wallet independently before querying.','neutral');
    } else {
      status(trustNotice,'Trusted wallet on this device: '+short(pin)+'. Resetting trust will also erase local rollback history.','good');
    }
  } catch { status(trustNotice,'Enter a service ID to see its saved publisher identity.','neutral'); }
}
serviceInput.addEventListener('input', refreshTrust);
refreshTrust();

$('pin-publisher').addEventListener('click',()=>{
  try{
    const id=currentId();
    serviceInput.value=id;
    const wallet=normalizeAddress(publisherInput.value.trim());
    const current=getPin(id);
    if (current && current!==wallet)
      throw Error('A different publisher is already pinned. If you genuinely need to change identity, use Reset trust first.');
    if (current===wallet) {
      return status(trustNotice,'This publisher is already trusted in this browser. You can query Arkiv below.','good');
    }
    requestConfirmation({
      title:'Have you verified this wallet?',
      description:'Confirm that you obtained this wallet address through the publisher’s authentic channel while it was still accessible. The service name or a shared link is NOT proof of identity.',
      value:wallet,
      label:'Yes, pin this wallet',
      action:()=>{
        tryStorage(()=>localStorage.setItem(pinKey(id),wallet));
        refreshTrust();
        status(notice,'Publisher wallet saved locally. You can now query the public recovery record.','good');
      }
    });
  }catch(error){status(trustNotice,describeError(error),'bad');}
});
$('clear-pin').addEventListener('click',()=>{
  try{
    const id=currentId();
    const current=getPin(id);
    if(!current)return status(trustNotice,'No pinned identity to reset for this service.','neutral');
    requestConfirmation({
      title:'Forget your trusted publisher?',
      description:'This also deletes saved revision, rotation, and revocation evidence from this device. It weakens rollback protection until you establish trust again. Only proceed if you understand the consequences.',
      value:current,
      label:'Reset local trust',
      action:()=>{
        tryStorage(()=>{
          localStorage.removeItem(pinKey(id));
          localStorage.removeItem(fenceKey(id));
        });
        resultBox.hidden=true;
        refreshTrust();
        status(notice,'Local publisher trust cleared. Authenticate a wallet again before recovering.','neutral');
      }
    });
  }catch(error){status(trustNotice,describeError(error),'bad');}
});

function describeIssue(issue){
  const messages={
    no_trusted_manifest:'No current record matches that authenticated publisher and service. Check the ID or ask the publisher for updated details.',
    conflicting_latest_revision:'Conflicting current versions were found. Recovery is blocked until the publisher resolves this.',
    conflicting_root_rotation:'Conflicting publisher changes were found. Recovery is blocked for your safety.',
    invalid_root_rotation:'Publisher change could not be validated. Do not use these recovery links.',
    publisher_rotation_rollback:'A previously verified publisher change is missing. Do not fall back to an older identity.',
    manifest_revision_rollback:'The record is older than one you previously verified. Recovery is blocked.',
    latest_manifest_revoked:'The publisher has revoked the current record. Do not use an older backup link.',
    invalid_publisher_revocation:'A published revocation could not be validated. Recovery is blocked for your safety.'
  };
  return messages[issue] || 'No unambiguous trusted active recovery record. Do not open unverified links.';
}
function statsHtml(head,records,filtered,selected,decision){
  return `<dl class="result-facts"><div><dt>Arkiv snapshot block</dt><dd><code>${escapeHtml(head)}</code></dd></div>
    <div><dt>Public records scanned</dt><dd>${records}</dd></div>
    <div><dt>Rejected records</dt><dd>${filtered}</dd></div>
    ${selected?`<div><dt>Verified entity key</dt><dd><code>${escapeHtml(selected.key)}</code></dd></div>
      <div><dt>Active publisher wallet</dt><dd><code>${escapeHtml(decision.activeSigner)}</code></dd></div>
      <div><dt>Version / epoch</dt><dd>${selected.manifest.revision} / ${decision.epoch}</dd></div>
      <div><dt>Expires at block</dt><dd><code>${escapeHtml(selected.expiresAt)}</code></dd></div>`:''}
  </dl>`;
}
function renderError(headBlock, entities, decision){
  const count=decision.rejected?.length??0;
  resultBox.innerHTML=`<div class="result-header failure"><i data-lucide="shield-alert"></i><div>
    <h3>No trusted recovery route</h3><p>${escapeHtml(describeIssue(decision.issue))}</p></div></div>`+
    statsHtml(headBlock,entities.length,count,null,decision)+
    '<div class="result-note"><i data-lucide="info"></i>Missing evidence is not permission to trust a different wallet. You can ask the publisher for a verified, current record.</div>';
}
function renderVerified({headBlock,entities,decision,monitorResults}){
  const selected=decision.selected;
  const rejected=decision.rejected??[];
  const endpoints=selected.manifest.endpoints.map(endpoint=>{
    const monitor=monitorResults.find(x=>x.endpoint_id===endpoint.id);
    const availability=monitor?.status??'unknown';
    const role=endpoint.role==='primary'?'Main website':'Backup website';
    const roleIcon=endpoint.role==='primary'?'globe-2':'external-link';
    return `<article class="endpoint-result">
      <div class="endpoint-result-body"><div class="endpoint-meta"><i data-lucide="${roleIcon}"></i>${role}</div>
        <h4>${escapeHtml(endpoint.id==='primary'?'Original destination':'Authorized recovery destination')}</h4>
        <div class="endpoint-url">${escapeHtml(endpoint.url)}</div>
        <div class="availability" data-kind="${escapeHtml(availability)}">Availability evidence: ${escapeHtml(availability.replaceAll('_',' '))}</div>
      </div>
      <a class="btn btn-outline" href="${escapeHtml(endpoint.url)}" target="_blank" rel="noopener noreferrer">Open website <i data-lucide="arrow-up-right"></i></a>
    </article>`;
  }).join('');
  const rejections=rejected.length?`<details class="rejections"><summary>View rejected records (${rejected.length})</summary>`+
    rejected.slice(0,20).map(record=>`<div class="rejection-row"><code>${escapeHtml(short(record.key))}</code><span>${escapeHtml(record.reason)}</span></div>`).join('')+
    '</details>':'';
  resultBox.innerHTML=`<div class="result-header"><i data-lucide="shield-check"></i><div><h3>Publisher identity verified</h3>
    <p>The record's actual on-chain creator matches your trusted publisher chain. These links are publisher-authorized, not guaranteed reachable or safe.</p></div></div>`+
    statsHtml(headBlock,entities.length,rejected.length,selected,decision)+
    '<h3 class="result-subtitle">Authorized destinations</h3>'+endpoints+
    '<div class="result-note"><i data-lucide="info"></i>Monitor evidence is optional. If no recent independent monitor records were verified, reachability remains unknown. You can try a backup without relying on its reported health.</div>'+
    rejections;
}

$('recovery-form').addEventListener('submit', async e=>{
  e.preventDefault();
  resultBox.hidden=true;
  let id,pin;
  try{
    id=currentId();
    serviceInput.value=id;
    const entered=normalizeAddress(publisherInput.value.trim());
    pin=getPin(id);
    if(!pin)throw Error('First authenticate and pin the publisher wallet above. We cannot safely guess who owns this service.');
    if(pin!==entered)throw Error('This wallet differs from the pinned publisher for this service. Do not silently change trusted identities.');
  }catch(error){return status(notice,describeError(error),'bad');}
  switchBusy(queryButton,true,'Verifying with Arkiv…');
  status(notice,'Reading the public Arkiv database directly. No publisher backend is involved.','busy');
  try{
    const {headBlock,entities}=await readPublicServiceRecords(id);
    const fence=readFence(id);
    const decision=resolveServiceState(entities,{pinnedPublisher:pin,serviceId:id,headBlock,...fence});
    if(decision.epoch!==undefined&&!['invalid_root_rotation','conflicting_root_rotation'].includes(decision.issue)) {
      updateFence(id,fence,decision);
    }
    if(!decision.selected){
      renderError(headBlock,entities,decision);
      status(notice,'No safely verifiable current recovery record was found.','bad');
    }else{
      const raw=$('trusted-monitors').value.trim();
      let monitorWallets=[];
      if(raw) {
        monitorWallets=raw.split(',').map(x=>normalizeAddress(x.trim())).filter(Boolean);
        if(monitorWallets.length>32)throw Error('You can verify at most 32 trusted monitors.');
      }
      let monitorResults=[];
      try{
        monitorResults=evaluateMonitorEvidence(
          entities.filter(entity=>entity.attributes?.kind?.value==='observation'),{
            manifest:decision.selected.manifest,manifestKey:decision.selected.key,
            headBlock,trustedMonitorWallets:monitorWallets,quorum:2
          });
      }catch{
        monitorResults=decision.selected.manifest.endpoints.map(x=>({endpoint_id:x.id,status:'unknown'}));
      }
      renderVerified({headBlock,entities,decision,monitorResults});
      status(notice,'Authenticated recovery information loaded directly from Arkiv.','good');
    }
    resultBox.hidden=false;
    paintIcons();
    const target=resultBox.querySelector('.result-header h3');
    if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
  }catch(error){
    status(notice,describeError(error),'bad');
    resultBox.hidden=true;
  }finally{
    switchBusy(queryButton,false);
  }
});
