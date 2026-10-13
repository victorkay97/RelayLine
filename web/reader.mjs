import './styles.css';
import { readPublicManifests, readPublicObservations } from '../src/browser-arkiv.mjs';
import { selectTrustedManifest, normalizeAddress } from '../src/policy.mjs';
import { byId, escapeHtml, status, short } from './dom.mjs';
import { evaluateMonitorEvidence } from '../src/monitor-policy.mjs';

// Recovery reader depends ONLY on public Arkiv RPC + independently built static assets.
// It never talks to any RelayLine backend or accepts a wallet's display name as proof.
const params = new URLSearchParams(location.search);
const idField = byId('recovery-service');
const walletField = byId('recovery-publisher');
const resultBox = byId('recovery-result');
const recoveryStatus = byId('recovery-status');
const pinStatus = byId('pin-status');
idField.value = params.get('service') ?? '';
walletField.value = params.get('publisher') ?? '';

function getPinKey(serviceId) { return 'relayline:v1:pinned:' + serviceId; }
function existingPin() {
  const serviceId = idField.value.trim();
  return serviceId ? localStorage.getItem(getPinKey(serviceId)) : null;
}
function refreshPin() {
  const stored = existingPin();
  status(pinStatus, stored ? 'Pinned publisher: ' + short(stored) :
    'No locally pinned wallet. Establish identity from a trusted channel before pinning.',
    stored ? 'good' : 'neutral');
}
byId('pin-publisher').addEventListener('click', () => {
  try {
    const serviceId = idField.value.trim();
    if (!/^[a-z0-9][a-z0-9-_]{0,62}$/.test(serviceId)) throw new Error('Invalid service ID');
    const wallet = normalizeAddress(walletField.value.trim());
    const stored = existingPin();
    if (stored && stored !== wallet) {
      throw new Error('Publisher identity is already pinned. Clear the pin explicitly before changing.');
    }
    if (!confirm('Did you independently authenticate this publisher wallet?\n\n' + wallet +
      '\n\nDo not pin it solely because you saw it on an untrusted search result or URL.')) return;
    localStorage.setItem(getPinKey(serviceId), wallet);
    refreshPin();
  } catch (error) { status(pinStatus, error.message, 'bad'); }
});
byId('clear-pin').addEventListener('click', () => {
  const serviceId = idField.value.trim();
  if (!serviceId || !existingPin()) return;
  if (confirm('Forget the pinned publisher for ' + serviceId + '? You must authenticate a replacement out of band.')) {
    localStorage.removeItem(getPinKey(serviceId));
    refreshPin();
  }
});
idField.addEventListener('input', refreshPin);
refreshPin();

byId('recovery-form').addEventListener('submit', async event => {
  event.preventDefault();
  const serviceId = idField.value.trim();
  resultBox.hidden = true;
  try {
    const entered = normalizeAddress(walletField.value.trim());
    const pin = existingPin();
    if (!pin) throw new Error('Pin an independently authenticated publisher wallet first.');
    if (pin !== entered) throw new Error('Entered wallet differs from pinned identity. Refusing silent identity change.');
    status(recoveryStatus, 'Querying Tiramisu directly. No application backend involved…');
    const { entities, headBlock } = await readPublicManifests(serviceId);
    const decision = selectTrustedManifest(entities, {
      pinnedPublisher: pin, serviceId, headBlock
    });
    const selected = decision.selected;
    const rejectCount = decision.rejected.length;
    const summary = [
      '<div class="eyebrow">Live public Arkiv query</div>',
      '<div class="evidence-row"><span>Snapshot block</span><code>' + escapeHtml(headBlock) + '</code></div>',
      '<div class="evidence-row"><span>Matched records</span><code>' + entities.length + '</code></div>',
      '<div class="evidence-row"><span>Rejected records</span><code>' + rejectCount + '</code></div>'
    ];
    if (!selected) {
      resultBox.innerHTML = summary.join('') +
        '<div class="callout callout-danger">No trusted active recovery manifest: ' + escapeHtml(decision.issue) +
        '. Do not open unverified links.</div>';
      status(recoveryStatus, 'No unambiguous trusted manifest.', 'bad');
    } else {
      // Monitoring is optional, and must NEVER affect publisher-authenticated endpoint authorization.
      // Each monitor must be pinned independently; with none configured, freshness is unknown.
      let monitorResults = [];
      const configuredMonitors = byId('trusted-monitors').value.split(',')
        .map(x => x.trim()).filter(Boolean).map(normalizeAddress);
      if (configuredMonitors.length) {
        try {
          const observationPage = await readPublicObservations(serviceId);
          if (selected.expiresAt <= observationPage.headBlock) {
            throw new Error('Manifest expired during separate observation query. Refresh.');
          }
          monitorResults = evaluateMonitorEvidence(observationPage.entities, {
            manifest: selected.manifest, manifestKey: selected.key,
            headBlock: observationPage.headBlock, trustedMonitorWallets: configuredMonitors, quorum: 2
          });
        } catch (error) {
          // Do not claim monitors have verified health if the query failed.
          monitorResults = selected.manifest.endpoints.map(ep => ({
            endpoint_id: ep.id, status: 'unknown', trustedSources: 0
          }));
        }
      }
      const endpoints = selected.manifest.endpoints.map(item => {
        return '<article class="endpoint"><div><span class="endpoint-role">' + escapeHtml(item.role) +
          '</span><h3>' + escapeHtml(item.id) + '</h3><span class="break">' +
          escapeHtml(item.url) + '</span><div class="monitor-status">Monitor status: ' +
          escapeHtml(monitorResults.find(result => result.endpoint_id === item.id)?.status ?? 'not configured') +
          '</div></div><a class="button button-secondary" rel="noopener noreferrer" target="_blank" href="' +
          escapeHtml(item.url) + '">Open ↗</a></article>';
      }).join('');
      const rejectionRows = decision.rejected.slice(0, 15).map(entry =>
        '<div class="rejection"><code>' + escapeHtml(short(entry.key)) + '</code><span>' +
        escapeHtml(entry.reason) + '</span></div>').join('');
      resultBox.innerHTML = summary.join('') +
        '<div class="callout">Publisher verified against immutable on-chain creator: <code class="break">' +
        escapeHtml(pin) + '</code><br>Endpoints are publisher-authorized, <strong>not automatically proven reachable or safe.</strong></div>' +
        '<div class="evidence-row"><span>Selected entity</span><code>' + escapeHtml(selected.key) + '</code></div>' +
        '<div class="evidence-row"><span>Revision</span><code>' + selected.manifest.revision + '</code></div>' +
        '<div class="evidence-row"><span>Expiry block</span><code>' + selected.expiresAt + '</code></div>' +
        '<div class="endpoint-list">' + endpoints + '</div>' +
        (rejectionRows ? '<details><summary>Rejected competing records (' + rejectCount + ')</summary>' + rejectionRows + '</details>' : '');
      status(recoveryStatus, 'Verified current publisher manifest. Direct Arkiv access succeeded.', 'good');
    }
    resultBox.hidden = false;
  } catch (error) {
    status(recoveryStatus, error?.message || 'Arkiv query failed.', 'bad');
    resultBox.hidden = true;
  }
});
