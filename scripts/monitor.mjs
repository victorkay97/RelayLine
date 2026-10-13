import { walletClient, publicClient, readManifests } from '../src/arkiv.mjs';
import { selectTrustedManifest } from '../src/policy.mjs';
import { monitorProbe } from '../src/monitor-probe.mjs';
import { publishObservation } from '../src/monitor-arkiv.mjs';

const serviceId = process.env.MONITOR_SERVICE_ID;
const pinnedPublisher = process.env.PINNED_PUBLISHER;
const endpointId = process.env.MONITOR_ENDPOINT_ID;
const approvedUrl = process.env.MONITOR_APPROVED_URL;
const publish = process.env.MONITOR_PUBLISH === 'YES';

async function main() {
  if (!serviceId || !pinnedPublisher || !endpointId || !approvedUrl) {
    throw new Error('Set MONITOR_SERVICE_ID, PINNED_PUBLISHER, MONITOR_ENDPOINT_ID and MONITOR_APPROVED_URL');
  }
  // Fail closed if an endpoint was not already approved by the local monitor operator.
  const allowlisted = new URL(approvedUrl).href;
  const { headBlock, entities } = await readManifests(serviceId);
  const decision = selectTrustedManifest(entities, { pinnedPublisher, serviceId, headBlock });
  if (!decision.selected) throw new Error('No unambiguous trusted service manifest: ' + decision.issue);
  const endpoint = decision.selected.manifest.endpoints.find(item => item.id === endpointId);
  if (!endpoint || endpoint.url !== allowlisted) throw new Error('Endpoint URL does not match signed manifest and operator allowlist');
  let response;
  try {
    response = await monitorProbe(endpoint.url, { approvedUrls: [allowlisted] });
  } catch (error) {
    // A configuration or DNS policy refusal is not an objective endpoint outage.
    throw new Error('Monitor probe inconclusive; no observation published: ' + error.message);
  }
  const observation = {
    schema_version: 1, service_id: serviceId, manifest_key: decision.selected.key,
    endpoint_id: endpoint.id, endpoint_url: endpoint.url,
    status: response.status, observed_at_ms: Date.now(), http_status: response.http_status
  };
  if (!publish) {
    console.log(JSON.stringify({ mode: 'DRY_RUN_NO_CHAIN_WRITE', observation }, null, 2));
    return;
  }
  const signer = walletClient('MONITOR_PRIVATE_KEY');
  const result = await publishObservation({
    publicClient: publicClient(), walletClient: signer.client, account: signer.address, observation
  });
  console.log(JSON.stringify({ mode: 'ACTUAL_ARKIV_WRITE', ...result }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
