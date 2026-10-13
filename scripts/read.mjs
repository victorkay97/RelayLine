// Independent reader: imports no application server, database or RelayLine hosted API.
import { readManifests } from '../src/arkiv.mjs';
import { selectTrustedManifest, chooseRecovery } from '../src/policy.mjs';
const publisher = process.env.PINNED_PUBLISHER;
const serviceId = process.env.SERVICE_ID ?? 'relayline-gate';
if (!publisher) {
  console.error('PINNED_PUBLISHER required. Never auto-trust a claimed identity.');
  process.exit(2);
}
try {
  const { headBlock, entities } = await readManifests(serviceId);
  const decision = selectTrustedManifest(entities, {
    pinnedPublisher: publisher, serviceId, headBlock,
    allowLoopback: process.env.ALLOW_LOOPBACK_TESTS === '1'
  });
  const evidence = {
    chain: 7738577, headBlock: headBlock.toString(), scannedEntities: entities.length,
    rejected: decision.rejected, issue: decision.issue,
    selected: decision.selected && {
      key: decision.selected.key, expiresAt: decision.selected.expiresAt.toString(),
      manifest: decision.selected.manifest
    }
  };
  if (decision.selected && process.argv.includes('--probe')) {
    // Local opt-in only. No public HTTP-to-URL probe service.
    evidence.recovery = await chooseRecovery(decision.selected.manifest);
  }
  console.log(JSON.stringify(evidence, null, 2));
  if (decision.issue) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', error: error.message }, null, 2));
  process.exitCode = 1;
}
