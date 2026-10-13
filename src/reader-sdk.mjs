import { queryServiceRecords } from './query.mjs';
import { resolveServiceState } from './control-policy.mjs';
import { evaluateMonitorEvidence } from './monitor-policy.mjs';

/**
 * Public, reusable, dependency-injected read API. No key, private backend, or
 * RelayLine account required. Callers supply any compatible Arkiv public client.
 */
export async function readAuthorizedService({
  client, serviceId, pinnedPublisher, trustFence = {},
  trustedMonitorWallets = [], monitorQuorum = 2
}){
  if(!client?.select||!client?.getChainId)throw new Error('Arkiv public client required');
  const {headBlock,entities}=await queryServiceRecords(client,serviceId);
  const decision=resolveServiceState(entities,{
    pinnedPublisher,serviceId,headBlock,...trustFence
  });
  const monitorResults=decision.selected?
    evaluateMonitorEvidence(entities.filter(r=>r.attributes?.kind?.value==='observation'),{
      manifest:decision.selected.manifest,manifestKey:decision.selected.key,
      headBlock,trustedMonitorWallets,quorum:monitorQuorum
    }):[];
  return {
    serviceId,headBlock,scannedRecords:entities.length,decision,
    monitorResults,independentlyQueryable:true
  };
}
