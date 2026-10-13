import { paintIcons, byId, escapeHtml, status, short, switchBusy, copyText, describeError } from './foundation.mjs';
import { connectPublisher, makePublicClient, publishFromBrowser, readPublicServiceRecords } from '../src/browser-arkiv.mjs';
import { validateManifest, normalizeAddress } from '../src/policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';

const $ = byId;
const form = $('publisher-form');
const message = $('publish-status');
const publishButton = $('publish-manifest');
const connectButton = $('connect-wallet');
const consent = $('publication-consent');
const STEPS = [...document.querySelectorAll('.wizard-step[data-step]')];
const SERVICE_ID = /^[a-z0-9][a-z0-9_-]{0,62}$/;
let session = null;
let currentStep = 1;
let busy = false;
let lastEvidence = null;

function announce(text, kind = 'neutral') { status(message, text, kind); }
function showStep(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3) return;
  currentStep = n;
  STEPS.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
  document.querySelectorAll('[data-journey]').forEach(li => {
    const number = Number(li.dataset.journey);
    li.classList.toggle('current', number === n);
    li.classList.toggle('done', number < n);
    li.setAttribute('aria-current', number === n ? 'step' : 'false');
  });
  $('step-label').textContent = 'STEP ' + n + ' OF 3';
  if (n === 3) updateReview();
  announce(n === 1 ? 'Start by naming the service you want to protect.' :
    n === 2 ? 'Add a primary website and a backup URL you control.' :
      'Review the details and approve a wallet transaction when you are ready.');
  const heading = STEPS.find(x => Number(x.dataset.step) === n)?.querySelector('legend');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}
function markError(inputId, errorId, reason) {
  $(inputId).setAttribute('aria-invalid', String(Boolean(reason)));
  const element = $(errorId);
  element.hidden = !reason;
  element.textContent = reason || '';
}
function validateId() {
  const val = $('service-id').value.trim().toLowerCase();
  $('service-id').value = val;
  let error = '';
  if (!val) error = 'Give your service a short identifier to continue.';
  else if (!SERVICE_ID.test(val)) error = 'Use lowercase letters, numbers, dashes or underscores only (up to 63 characters).';
  markError('service-id', 'service-error', error);
  return !error;
}
function createManifest() {
  const manifest = {
    schema_version: 1,
    service_id: $('service-id').value.trim().toLowerCase(),
    revision: Number($('revision').value || 1),
    endpoints: [
      { id: 'primary', role: 'primary', url: $('primary-url').value.trim() },
      { id: 'fallback', role: 'fallback', url: $('fallback-url').value.trim() }
    ]
  };
  return validateManifest(manifest);
}
function validateEndpoints() {
  markError('primary-url','primary-error','');
  markError('fallback-url','fallback-error','');
  let manifest;
  try { manifest = createManifest(); }
  catch (error) {
    const urlField = /fallback|backup|duplicate/i.test(error.message) ? 'fallback' : 'primary';
    markError(urlField + '-url', urlField + '-error', error.message);
    announce('Please correct the website addresses before continuing.', 'bad');
    return false;
  }
  const primary = manifest.endpoints[0].url;
  const fallback = manifest.endpoints[1].url;
  if (primary === fallback) {
    markError('fallback-url','fallback-error','Use a different HTTPS website for your backup.');
    return false;
  }
  $('primary-url').value = primary;
  $('fallback-url').value = fallback;
  return true;
}
function updateReview() {
  const m = createManifest();
  $('review-service').textContent = m.service_id;
  $('review-primary').textContent = m.endpoints[0].url;
  $('review-fallback').textContent = m.endpoints[1].url;
  $('review-revision').textContent = String(m.revision);
  syncAction();
}
function syncAction() {
  publishButton.disabled = !session || !consent.checked || busy;
}
$('next-one').addEventListener('click', () => {
  if (!validateId()) return $('service-id').focus();
  showStep(2);
});
$('next-two').addEventListener('click', () => {
  if (!validateEndpoints()) return;
  showStep(3);
});
$('back-two').addEventListener('click', () => showStep(1));
$('back-three').addEventListener('click', () => showStep(2));
$('service-id').addEventListener('input', () => markError('service-id','service-error',''));
for (const prefix of ['primary','fallback']) {
  $(prefix+'-url').addEventListener('input', () => markError(prefix+'-url',prefix+'-error',''));
}
consent.addEventListener('change', syncAction);

function disconnected(reason) {
  session = null;
  $('publisher-address').textContent = 'Connect a wallet to authorize this public record.';
  connectButton.textContent = 'Connect wallet';
  syncAction();
  if (reason) announce(reason,'neutral');
}
connectButton.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  switchBusy(connectButton, true, 'Connecting…');
  announce('Check your wallet extension for the connection request.', 'busy');
  try {
    const connected = await connectPublisher();
    session = connected;
    $('publisher-address').textContent = connected.account;
    announce('Wallet connected. The publisher wallet will be recorded publicly on Arkiv.', 'good');
    $('load-status').textContent = 'You can load an existing service from Arkiv, or publish your first version.';
  } catch (error) {
    disconnected();
    announce(describeError(error),'bad');
  } finally {
    busy = false;
    switchBusy(connectButton, false);
    if (session) {
      connectButton.textContent = 'Wallet connected';
      $('publisher-address').textContent = session.account;
    }
    syncAction();
  }
});
if (globalThis.ethereum?.on) {
  globalThis.ethereum.on('accountsChanged', () => disconnected('Your wallet account changed. Reconnect before publishing.'));
  globalThis.ethereum.on('chainChanged', () => disconnected('Your wallet network changed. Reconnect on Arkiv Tiramisu.'));
}
async function fetchCurrentSignerRecord(serviceId, signer) {
  const { entities, headBlock } = await readPublicServiceRecords(serviceId);
  const decision = resolveServiceState(entities, { pinnedPublisher: signer, serviceId, headBlock });
  return { decision, headBlock, records: entities.length };
}
$('load-existing').addEventListener('click', async () => {
  if (!session) return status($('load-status'),'Connect the original publisher wallet first.','bad');
  if (!validateId()) return status($('load-status'),'Enter a valid service identifier first.','bad');
  const button = $('load-existing');
  switchBusy(button, true, 'Checking Arkiv…');
  try {
    const { decision } = await fetchCurrentSignerRecord($('service-id').value, session.account);
    if (!decision.selected) throw Error(decision.issue === 'no_trusted_manifest' ?
      'There is no active service for this wallet and ID. You can publish version 1.' :
      'Cannot safely load this service: ' + decision.issue);
    if (normalizeAddress(decision.activeSigner) !== normalizeAddress(session.account)) {
      throw Error('This service has changed publisher wallets. Connect the active successor wallet to manage it.');
    }
    const manifest = decision.selected.manifest;
    if (manifest.revision >= 9999999) throw Error('Maximum supported revision reached.');
    $('revision').value = String(manifest.revision + 1);
    $('primary-url').value = manifest.endpoints.find(x => x.role === 'primary')?.url || '';
    $('fallback-url').value = manifest.endpoints.find(x => x.role === 'fallback')?.url || '';
    consent.checked = false;
    status($('load-status'), 'Loaded version ' + manifest.revision + '. Edit the addresses and publish version ' + (manifest.revision+1) + '.', 'good');
    showStep(2);
  } catch (error) { status($('load-status'), describeError(error), 'bad'); }
  finally { switchBusy(button,false); }
});
async function preventOverwritingCurrent(m) {
  const {decision} = await fetchCurrentSignerRecord(m.service_id, session.account);
  if (decision.issue && decision.issue !== 'no_trusted_manifest') {
    throw Error('Cannot safely publish: ' + decision.issue + '. Resolve the conflict first.');
  }
  if (decision.selected && normalizeAddress(decision.activeSigner) !== normalizeAddress(session.account)) {
    throw Error('This service has rotated signing wallets. Reconnect using the current authorized wallet.');
  }
  if (decision.selected && m.revision <= decision.selected.manifest.revision) {
    throw Error('Version ' + decision.selected.manifest.revision +
      ' already exists. Use "Load latest version" to prepare a safe update.');
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || currentStep !== 3) return;
  if (!session) return announce('Connect your publisher wallet first.','bad');
  if (!consent.checked) return announce('Confirm that you understand the public record and testnet transaction.','bad');
  if (!validateId() || !validateEndpoints()) return showStep(2);
  const manifest = createManifest();
  busy = true;
  switchBusy(publishButton,true,'Checking existing records…');
  try {
    await preventOverwritingCurrent(manifest);
    if (!session) throw Error('Wallet changed. Reconnect and try again.');
    switchBusy(publishButton,true,'Waiting for wallet approval…');
    announce('Your wallet will ask you to approve a testnet transaction. Nothing is saved until you approve.','busy');
    lastEvidence = await publishFromBrowser({session,manifest});
    if (!lastEvidence.entityKey || !lastEvidence.txHash) {
      throw Error('The SDK did not return an entity key and transaction hash. Verify your wallet history before retrying.');
    }
    let independentlyVerified=false;
    try {
      const {decision}=await fetchCurrentSignerRecord(manifest.service_id,session.account);
      independentlyVerified=decision.selected?.key?.toLowerCase()===lastEvidence.entityKey.toLowerCase();
    } catch { /* possible indexing delay or RPC failure; do not claim success */ }
    $('completion-explainer').textContent = independentlyVerified ?
      'Your signed record was independently retrieved from Arkiv. Give your audience your service ID and publisher wallet through an authenticated channel.' :
      'The wallet returned a transaction receipt. Independent read-back is still pending; use the reader to verify before relying on recovery.';
    $('complete-title').textContent = independentlyVerified ?
      'Your recovery plan is live.' : 'Your transaction was submitted.';
    const kv=[
      ['Publisher wallet',lastEvidence.creator],
      ['Transaction hash',lastEvidence.txHash],
      ['Entity key',lastEvidence.entityKey],
      ['Read-back',independentlyVerified?'Verified from Arkiv':'Not verified yet']
    ];
    $('evidence').innerHTML=kv.map(([label,value])=>
      '<div class="receipt-row"><span>'+escapeHtml(label)+'</span><code>'+escapeHtml(value)+'</code>'+
      '<button type="button" class="copy-mini" data-copy="'+escapeHtml(value)+'" aria-label="Copy '+escapeHtml(label)+'"><i data-lucide="copy"></i></button></div>'
    ).join('');
    const url=new URL('https://relayline-reader.vercel.app/');
    url.searchParams.set('service',manifest.service_id);
    url.searchParams.set('publisher',lastEvidence.creator);
    $('open-reader').href=url.href;
    form.hidden=true;
    $('completion').hidden=false;
    $('step-label').textContent='PUBLICATION RESULT';
    announce(independentlyVerified ? 'The live record has been independently verified.' :
      'Signed transaction receipt returned. On-chain read-back is still pending.',
      independentlyVerified?'good':'neutral');
    paintIcons();
    $('complete-title').setAttribute('tabindex','-1');
    $('complete-title').focus();
  } catch (error) { announce(describeError(error),'bad'); }
  finally {
    busy=false;
    switchBusy(publishButton,false);
    syncAction();
  }
});
$('evidence').addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy]');
  if(!button)return;
  try {await copyText(button.dataset.copy);button.setAttribute('aria-label','Copied to clipboard');}
  catch(error){announce(error.message,'bad');}
});
$('start-again').addEventListener('click',()=>{
  $('completion').hidden=true;
  form.hidden=false;
  $('publisher-form').reset();
  $('revision').value='1';
  consent.checked=false;
  showStep(1);
  syncAction();
});
(async()=>{
  const el=$('network-indicator');
  try{
    if(await makePublicClient().getChainId()!==7738577)throw Error('Unexpected testnet');
    status(el,'Arkiv testnet connected','good');
  }catch{status(el,'Arkiv connection not verified','bad');}
})();
showStep(1);
