import './styles.css';
import { connectPublisher, makePublicClient, publishFromBrowser, readPublicManifests } from '../src/browser-arkiv.mjs';
import { normalizeAddress, validateManifest, selectTrustedManifest } from '../src/policy.mjs';
import { byId, escapeHtml, short, status, q } from './dom.mjs';

let session = null, lastEvidence = null;
const connectButton = byId('connect-wallet');
const publishButton = byId('publish-manifest');
const walletLabel = byId('wallet-label');
const publishStatus = byId('publish-status');
const evidence = byId('evidence');
const networkIndicator = byId('network-indicator');

async function checkNetwork() {
  try {
    const chain = await makePublicClient().getChainId();
    if (chain !== 7738577) throw new Error('Unexpected chain ' + chain);
    status(networkIndicator, '● Tiramisu connected · 7738577', 'good');
  } catch (error) {
    status(networkIndicator, '● RPC unavailable · retry', 'bad');
  }
}

connectButton.addEventListener('click', async () => {
  connectButton.disabled = true;
  status(publishStatus, 'Connecting browser wallet…');
  try {
    session = await connectPublisher();
    walletLabel.textContent = short(session.account);
    connectButton.textContent = 'Connected ✓';
    publishButton.disabled = false;
    status(publishStatus, 'Wallet connected. Review the endpoints before signing.', 'good');
    byId('publisher-address').textContent = session.account;
  } catch (error) {
    session = null;
    status(publishStatus, error.message, 'bad');
    connectButton.textContent = 'Connect wallet';
    walletLabel.textContent = 'Not connected';
  } finally {
    connectButton.disabled = false;
  }
});
if (globalThis.ethereum?.on) {
  globalThis.ethereum.on('accountsChanged', () => {
    session = null; publishButton.disabled = true;
    walletLabel.textContent = 'Account changed'; connectButton.textContent = 'Reconnect wallet';
    status(publishStatus, 'Reconnect after changing accounts.', 'neutral');
  });
  globalThis.ethereum.on('chainChanged', () => {
    session = null; publishButton.disabled = true; connectButton.textContent = 'Reconnect wallet';
    status(publishStatus, 'Network changed. Reconnect on Tiramisu.', 'neutral');
  });
}

byId('publisher-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!session) return status(publishStatus, 'Connect your wallet first.', 'bad');
  const id = byId('service-id').value.trim();
  const revision = Number(byId('revision').value);
  const manifest = {
    schema_version: 1, service_id: id, revision,
    endpoints: [
      { id: 'primary', role: 'primary', url: byId('primary-url').value.trim() },
      { id: 'fallback', role: 'fallback', url: byId('fallback-url').value.trim() }
    ]
  };
  let validated;
  try { validated = validateManifest(manifest); }
  catch (error) { return status(publishStatus, error.message, 'bad'); }
  if (!confirm(
    'Publish a public, read-only service manifest on Arkiv Tiramisu?\n\n' +
    'Publisher: ' + session.account + '\n' +
    'Service: ' + validated.service_id + ' (revision ' + validated.revision + ')\n' +
    'Primary: ' + validated.endpoints[0].url + '\n' +
    'Fallback: ' + validated.endpoints[1].url + '\n\n' +
    'The wallet will request a test GLM transaction. Public metadata can be copied indefinitely.'
  )) return;
  publishButton.disabled = true;
  status(publishStatus, 'Awaiting wallet approval and chain confirmation…', 'neutral');
  try {
    lastEvidence = await publishFromBrowser({ session, manifest: validated });
    status(publishStatus, 'Manifest confirmed on Arkiv. Verify direct querying below.', 'good');
    evidence.hidden = false;
    evidence.innerHTML = [
      '<div class="eyebrow">Transaction confirmed</div>',
      '<div class="evidence-row"><span>Creator wallet</span><code>' + escapeHtml(lastEvidence.creator) + '</code></div>',
      '<div class="evidence-row"><span>Transaction hash</span><code>' + escapeHtml(lastEvidence.txHash) + '</code></div>',
      '<div class="evidence-row"><span>Entity key</span><code>' + escapeHtml(lastEvidence.entityKey) + '</code></div>',
      '<div class="evidence-row"><span>Expiry block</span><code>' + escapeHtml(lastEvidence.expiresAt) + '</code></div>',
      '<a class="button button-secondary" href="recover.html?service=' + q(lastEvidence.service_id) +
      '&publisher=' + q(lastEvidence.creator) +
      '">Open independent reader ↗</a>'
    ].join('');
  } catch (error) {
    status(publishStatus, error?.shortMessage || error?.message || 'Transaction failed', 'bad');
  } finally {
    publishButton.disabled = !session;
  }
});

byId('verify-publication').addEventListener('click', async () => {
  if (!session) return status(publishStatus, 'Connect the publishing wallet first.', 'bad');
  try {
    const serviceId = byId('service-id').value.trim();
    status(publishStatus, 'Directly querying Arkiv for authenticated records…');
    const { headBlock, entities } = await readPublicManifests(serviceId);
    const result = selectTrustedManifest(entities, {
      pinnedPublisher: session.account, serviceId, headBlock
    });
    if (!result.selected) {
      status(publishStatus, 'No unambiguous trusted manifest found: ' + result.issue, 'bad');
    } else {
      status(publishStatus, 'Verified on-chain creator at block ' + headBlock +
        ' · revision ' + result.selected.manifest.revision + ' · ' + entities.length + ' records examined.', 'good');
    }
  } catch (error) {
    status(publishStatus, error.message, 'bad');
  }
});
checkNetwork();
