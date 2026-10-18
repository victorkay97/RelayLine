import './workspace.css';
import { paintIcons, byId, escapeHtml, status, short, switchBusy, copyText, describeError } from './foundation.mjs';
import { connectPublisher, readPublicServiceRecords } from '../src/browser-arkiv.mjs';
import { browserPublisherPortfolio } from '../src/portfolio.mjs';
import { normalizeAddress, validateManifest } from '../src/policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
import { classifyPortfolioDecision } from './workspace-state.mjs';

const $=byId;
const walletText=$('workspace-wallet-address'), connect=$('workspace-connect');
const disconnect=$('workspace-disconnect'), refresh=$('workspace-refresh'), list=$('workspace-list');
const search=$('workspace-search'), empty=$('workspace-empty');
let session=null, items=[], loading=false, generation=0;

function alertStatus(message,kind='neutral'){status($('workspace-status'),message,kind)}
function readUrl(id,root){
 const u=new URL('recover.html',location.href);
 u.searchParams.set('service',id);u.searchParams.set('publisher',root);
 return u.toString();
}
function editorUrl(manifest){
 const u=new URL('workspace.html',location.href);
 u.searchParams.set('edit',manifest.service_id);
 u.hash='setup';
 return u.toString();
}
function renderedCards(){
 const term=search.value.trim().toLowerCase();
 const shown=items.filter(x=>x.id.includes(term));
 list.hidden=!shown.length;
 empty.hidden=shown.length>0;
 if(!shown.length){
   empty.querySelector('h3').textContent=items.length?'No matching services':'No active service manifests discovered';
   empty.querySelector('p').textContent=items.length?'Try a different service ID.':'This wallet has no currently discoverable signed manifests. Records can expire or be outside the bounded Arkiv query.';
   return;
 }
 list.innerHTML=shown.map(item=>{
   const selected=item.decision?.selected;
   const active=item.status==='active';
   const end=selected?.manifest?.endpoints||[];
   const primary=end.find(x=>x.role==='primary')?.url||item.manifest?.endpoints.find(x=>x.role==='primary')?.url||'—';
   const fallback=end.find(x=>x.role==='fallback')?.url||item.manifest?.endpoints.find(x=>x.role==='fallback')?.url||'—';
   const revoked=item.status==='revoked';
   const badge=active?'Wallet-signed record':revoked?'Latest record revoked':item.status==='rotated'?'Authority transferred':'Review required';
   const share=readUrl(item.id,session.account);
   return `<article class="portfolio-card">
    <div class="portfolio-card-head"><div class="portfolio-avatar"><i data-lucide="globe-2"></i></div><div><span class="overline">SERVICE ID</span><h3>${escapeHtml(item.id)}</h3></div><span class="portfolio-status ${active?'is-active':'is-review'}">${escapeHtml(badge)}</span></div>
    <div class="portfolio-lines"><div><span>${revoked?'Previous primary (revoked)':'Primary destination'}</span><strong title="${escapeHtml(primary)}">${escapeHtml(primary)}</strong></div><div><span>${revoked?'Previous backup (revoked)':'Recovery destination'}</span><strong title="${escapeHtml(fallback)}">${escapeHtml(fallback)}</strong></div></div>
    <div class="portfolio-facts"><span>Revision ${escapeHtml(selected?.manifest?.revision??item.manifest?.revision??'—')}</span><span>Created by ${escapeHtml(short(session.account))}</span></div>
    <div class="portfolio-actions">${active?`<button class="btn btn-primary" type="button" data-edit="${escapeHtml(item.id)}">Edit signed record <i data-lucide="arrow-up-right"></i></button>`:''}<a class="btn btn-quiet" href="${escapeHtml(share)}" target="_blank" rel="noopener noreferrer">${revoked?'Inspect revocation':'Open reader'}</a>${!revoked?`<button class="btn btn-quiet" type="button" data-share="${escapeHtml(item.id)}"><i data-lucide="copy"></i> Copy reader link</button>`:'' }</div>
    <p class="portfolio-warning">${escapeHtml(item.issue)}</p>
   </article>`;
 }).join('');
 paintIcons();
}
async function load(){
 if(!session||loading)return;
 const mine=session.account,token=++generation;loading=true;
 switchBusy(refresh,true,'Loading…');
 alertStatus('Reading manifests created by this wallet directly from Arkiv…','busy');
 try{
   const {headBlock,records}=await browserPublisherPortfolio(mine);
   if(token!==generation||!session||normalizeAddress(session.account)!==normalizeAddress(mine))return;
   const groups=new Map();
   for(const record of records){
     try{
       if(normalizeAddress(record.creator)!==normalizeAddress(mine))continue;
       if(record.expiresAt<=headBlock||record.attributes?.kind?.value!=='manifest')continue;
       const m=validateManifest(record.data);
       if(record.attributes?.project?.value!=='relayline-v1'||record.attributes?.service_id?.value!==m.service_id
         ||record.attributes?.revision?.type!=='u64'||BigInt(m.revision)!==record.attributes.revision.value)continue;
       const g=groups.get(m.service_id)||[];
       g.push({manifest:m,record});
       groups.set(m.service_id,g);
     }catch{}
   }
   const keys=[...groups.keys()].sort();
   const out=await Promise.all(keys.map(async id=>{
     const group=groups.get(id).sort((a,b)=>b.manifest.revision-a.manifest.revision);
     try{
       const {entities,headBlock:at}=await readPublicServiceRecords(id);
       const decision=resolveServiceState(entities,{pinnedPublisher:mine,serviceId:id,headBlock:at});
       const state=classifyPortfolioDecision(decision,mine);
       return {id,manifest:group[0].manifest,decision,...state};
     }catch(error){
       return{id,manifest:group[0].manifest,decision:null,status:'review',issue:'Could not verify current authority: '+describeError(error)};
     }
   }));
   if(token!==generation||!session)return;
   items=out;
   $('metric-total').textContent=String(out.length);
   $('metric-active').textContent=String(out.filter(x=>x.status==='active').length);
   $('metric-review').textContent=String(out.filter(x=>x.status!=='active').length);
   renderedCards();
   alertStatus('Read '+records.length+' signed manifest records across '+out.length+' service IDs. Wallet signatures do not prove the globally trusted publisher, and these counts are not uptime checks.','good');
 }catch(error){
   if(token!==generation)return;
   items=[];renderedCards();
   alertStatus('Portfolio not verified: '+describeError(error),'bad');
 }finally{loading=false;switchBusy(refresh,false)}
}
async function beginConnect(){
 if(loading)return;
 switchBusy(connect,true,'Connecting…');
 try{
   const current=await connectPublisher();
   session=current;items=[];
   walletText.textContent=current.account;
   connect.hidden=true;disconnect.hidden=false;refresh.disabled=false;
   await load();
 }catch(error){alertStatus(describeError(error),'bad')}
 finally{switchBusy(connect,false)}
}
function reset(message){
 generation++;session=null;items=[];loading=false;
 walletText.textContent='Not connected';
 connect.hidden=false;disconnect.hidden=true;refresh.disabled=true;
 $('metric-total').textContent='—';$('metric-active').textContent='—';$('metric-review').textContent='—';
 renderedCards();if(message)alertStatus(message);
}
connect.addEventListener('click',beginConnect);
disconnect.addEventListener('click',()=>reset('Workspace view disconnected. Wallet extension authorization remains controlled by your wallet.'));
refresh.addEventListener('click',load);
search.addEventListener('input',renderedCards);
list.addEventListener('click',async event=>{
 const edit=event.target.closest('[data-edit]');
 if(edit && session){
   const item=items.find(x=>x.id===edit.dataset.edit && x.status==='active');
   if(!item?.decision?.selected) return alertStatus('This record is not verified for editing. Refresh the portfolio.','bad');
   const manifest=item.decision.selected.manifest;
   if(manifest.revision>=9999999) return alertStatus('Maximum revision reached.','bad');
   // The existing wallet-signing wizard owns validation and safety checks.
   $('completion').hidden=true; $('publisher-form').hidden=false;
   $('publisher-form').reset();
   $('service-id').value=item.id;
   $('primary-url').value=manifest.endpoints.find(x=>x.role==='primary')?.url||'';
   $('fallback-url').value=manifest.endpoints.find(x=>x.role==='fallback')?.url||'';
   $('revision').value=String(manifest.revision+1);
   $('next-one').click();
   $('load-status').textContent='Prefilled from the verified record. Review endpoints; the wallet and current revision will be checked again before signing.';
   openPublisherPanel();
   location.hash='setup';
   $('setup').scrollIntoView({block:'start',behavior:'smooth'});
   return;
 }
 const button=event.target.closest('[data-share]');
 if(!button||!session)return;
 const id=button.dataset.share;
 // Disclosure: URI parameters are NOT identity proof, show in accompanying guidance.
 try{await copyText(readUrl(id,session.account));alertStatus('Reader link copied. Its wallet parameter is not identity proof: recipients must independently authenticate the publisher first.','good')}
 catch(error){alertStatus(describeError(error),'bad')}
});
if(globalThis.ethereum?.on){
 globalThis.ethereum.on('accountsChanged',()=>reset('Wallet account changed. Reconnect to refresh verified service ownership.'));
 globalThis.ethereum.on('chainChanged',()=>reset('Wallet network changed. Reconnect using Arkiv Tiramisu.'));
}
renderedCards();

/* On-page publisher wizard: no hop to the separate legacy Vercel app. */
const publisherPanel=$('setup');
function openPublisherPanel(){
  publisherPanel.hidden=false;
  // The existing publisher module owns wallet approval, validation and safe writes.
  paintIcons();
}
for(const control of document.querySelectorAll('[data-open-publisher]')){
  control.addEventListener('click',openPublisherPanel);
}
window.addEventListener('hashchange',()=>{
  if(location.hash==='#setup')openPublisherPanel();
});
$('workspace-publish-close').addEventListener('click',()=>{
  publisherPanel.hidden=true;
  if(location.hash==='#setup'){
    const url=new URL(location.href);url.hash='';
    history.replaceState(null,'',url);
  }
  document.getElementById('workspace-services-title').scrollIntoView({block:'start',behavior:'smooth'});
});
if(location.hash==='#setup'||new URLSearchParams(location.search).has('edit')){
  openPublisherPanel();
}
