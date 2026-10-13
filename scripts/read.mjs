// Independent reader: imports no application server, database or RelayLine hosted API.
import { readServiceRecords } from '../src/arkiv.mjs';
import { chooseRecovery } from '../src/policy.mjs';
import { resolveServiceState } from '../src/control-policy.mjs';
const publisher = process.env.PINNED_PUBLISHER;
const serviceId = process.env.SERVICE_ID ?? 'relayline-gate';
if (!publisher) {
  console.error('PINNED_PUBLISHER required. Never auto-trust a claimed identity.');
  process.exit(2);
}
try {
  const { headBlock, entities } = await readServiceRecords(serviceId);
  const decision = resolveServiceState(entities, {
    pinnedPublisher: publisher, serviceId, headBlock,
    minRevision: Number(process.env.MIN_SEEN_REVISION ?? 0),
    minEpoch: Number(process.env.MIN_SEEN_EPOCH ?? 0)
  });
  const evidence = {
    chain: 7738577, headBlock: headBlock.toString(), scannedEntities: entities.length,
    rejected: decision.rejected, issue: decision.issue, epoch: decision.epoch,
    activeSigner: decision.activeSigner, revokedKeys: decision.revokedKeys,
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
