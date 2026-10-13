import { normalizeAddress } from './policy.mjs';

const HEX32 = /^0x[a-fA-F0-9]{64}$/;
const SERVICE = /^[a-z0-9][a-z0-9-_]{0,62}$/;
const ENDPOINT = /^[a-z0-9][a-z0-9-_]{0,62}$/;
const MAX_AGE_MS = 15 * 60 * 1000;
export const MONITOR_TTL_MINUTES = 10;

export function validateObservation(data, { nowMs = Date.now() } = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.schema_version !== 1) {
    throw new Error('Invalid observation schema version');
  }
  if (!SERVICE.test(data.service_id ?? '') || !ENDPOINT.test(data.endpoint_id ?? '')) {
    throw new Error('Invalid service/endpoint identifier');
  }
  if (typeof data.manifest_key !== 'string' || !HEX32.test(data.manifest_key)) {
    throw new Error('Invalid manifest entity key');
  }
  if (!['reachable', 'unreachable'].includes(data.status)) throw new Error('Invalid observation status');
  if (!Number.isSafeInteger(data.observed_at_ms) || data.observed_at_ms > nowMs + 60_000 ||
      nowMs - data.observed_at_ms > MAX_AGE_MS) {
    throw new Error('Observation timestamp stale or in the future');
  }
  if (data.http_status !== null && data.http_status !== undefined &&
    (!Number.isSafeInteger(data.http_status) || data.http_status < 100 || data.http_status > 599)) {
    throw new Error('Invalid HTTP status');
  }
  if (typeof data.endpoint_url !== 'string') throw new Error('Missing endpoint URL');
  const url = new URL(data.endpoint_url);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('Observation endpoint must be public HTTPS');
  }
  return {
    schema_version: 1, service_id: data.service_id,
    manifest_key: data.manifest_key.toLowerCase(),
    endpoint_id: data.endpoint_id, endpoint_url: url.href,
    status: data.status, observed_at_ms: data.observed_at_ms,
    http_status: data.http_status ?? null
  };
}

/**
 * Observations are wallet-attributed statements, NOT evidence of objective censorship.
 * All monitor wallets must be explicitly trusted out-of-band. No default monitor.
 * Mixed trusted reports => disputed. Lack of quorum => unknown.
 */
export function evaluateMonitorEvidence(records, { manifest, manifestKey, headBlock,
  trustedMonitorWallets = [], quorum = 2, nowMs = Date.now() } = {}) {
  if (typeof headBlock !== 'bigint') throw new Error('Missing chain snapshot');
  if (!manifest || !HEX32.test(manifestKey ?? '')) throw new Error('Verified manifest required');
  if (!Array.isArray(records)) throw new Error('Missing records');
  if (!Array.isArray(trustedMonitorWallets) || trustedMonitorWallets.length > 32) throw new Error('Invalid monitor list');
  const trusted = new Set(trustedMonitorWallets.map(normalizeAddress));
  if (!Number.isSafeInteger(quorum) || quorum < 1 || quorum > 32) throw new Error('Invalid quorum');
  const output = [];
  for (const endpoint of manifest.endpoints) {
    const perWallet = new Map();
    let rejected = 0;
    for (const record of records) {
      try {
        if (!trusted.has(normalizeAddress(record.creator))) throw new Error('untrusted creator');
        if (!HEX32.test(record.key ?? '') || typeof record.expiresAt !== 'bigint' ||
            record.expiresAt <= headBlock || typeof record.createdAt !== 'bigint') {
          throw new Error('expired or missing chain metadata');
        }
        const a = record.attributes;
        if (a?.project?.type !== 'str' || a.project.value !== 'relayline-v1' ||
            a?.kind?.type !== 'str' || a.kind.value !== 'observation' ||
            a?.service_id?.type !== 'str' || a.service_id.value !== manifest.service_id) {
          throw new Error('attribute mismatch');
        }
        const obs = validateObservation(record.data, { nowMs });
        if (obs.service_id !== manifest.service_id ||
            obs.manifest_key !== manifestKey.toLowerCase() ||
            obs.endpoint_id !== endpoint.id || obs.endpoint_url !== endpoint.url) {
          throw new Error('manifest/endpoint mismatch');
        }
        const signer = normalizeAddress(record.creator);
        const previous = perWallet.get(signer);
        if (!previous || record.createdAt > previous.block) {
          perWallet.set(signer, { block: record.createdAt, status: obs.status, key: record.key, equivocated: false });
        } else if (record.createdAt === previous.block && (
          record.key !== previous.key || previous.status !== obs.status
        )) {
          previous.equivocated = true;
        }
      } catch {
        rejected++;
      }
    }
    const usable = [...perWallet.values()].filter(item => !item.equivocated);
    const reachable = usable.filter(item => item.status === 'reachable').length;
    const unreachable = usable.filter(item => item.status === 'unreachable').length;
    const status = trusted.size === 0 ? 'not_configured' :
      reachable && unreachable ? 'disputed' :
      reachable >= quorum ? 'reachable' :
      unreachable >= quorum ? 'unreachable' : 'unknown';
    output.push({
      endpoint_id: endpoint.id, endpoint_url: endpoint.url,
      status, reachable, unreachable, trustedSources: usable.length,
      quorum, rejected, evidenceKeys: usable.map(item => item.key)
    });
  }
  return output;
}
