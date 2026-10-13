/** Standalone trust policy. No Arkiv/network imports: independently auditable. */
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const HEX32 = /^0x[a-fA-F0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-_]{0,62}$/;

export function normalizeAddress(value) {
  if (typeof value !== 'string' || !ADDRESS.test(value)) throw new Error('Invalid pinned wallet address');
  return value.toLowerCase();
}

export function validateEndpoint(endpoint, { allowLoopback = false } = {}) {
  if (!endpoint || typeof endpoint !== 'object' || Array.isArray(endpoint)) throw new Error('Bad endpoint');
  if (!ID.test(endpoint.id ?? '')) throw new Error('Invalid endpoint ID');
  if (!['primary', 'fallback'].includes(endpoint.role)) throw new Error('Invalid endpoint role');
  let url;
  try { url = new URL(endpoint.url); } catch { throw new Error('Invalid endpoint URL'); }
  if (url.username || url.password || url.hash) throw new Error('Endpoint URL contains credentials or fragment');
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase());
  if (url.protocol !== 'https:' && !(allowLoopback && loopback && url.protocol === 'http:')) {
    throw new Error('Only HTTPS endpoints accepted (except explicit loopback tests)');
  }
  if (url.hostname.length > 253) throw new Error('Endpoint hostname too long');
  return { id: endpoint.id, role: endpoint.role, url: url.href };
}

export function validateManifest(manifest, { serviceId, allowLoopback = false } = {}) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Bad manifest');
  if (manifest.schema_version !== 1) throw new Error('Unsupported schema version');
  if (!ID.test(manifest.service_id ?? '') || (serviceId && manifest.service_id !== serviceId)) {
    throw new Error('Service ID mismatch');
  }
  if (!Number.isSafeInteger(manifest.revision) || manifest.revision < 1) throw new Error('Invalid revision');
  if (!Array.isArray(manifest.endpoints) || manifest.endpoints.length < 2 || manifest.endpoints.length > 10) {
    throw new Error('Expected 2–10 endpoints');
  }
  const endpoints = manifest.endpoints.map(item => validateEndpoint(item, { allowLoopback }));
  if (endpoints.filter(item => item.role === 'primary').length !== 1 ||
      !endpoints.some(item => item.role === 'fallback')) throw new Error('Require one primary and a fallback');
  if (new Set(endpoints.map(item => item.id)).size !== endpoints.length) throw new Error('Duplicate endpoint ID');
  if (new Set(endpoints.map(item => item.url)).size !== endpoints.length) throw new Error('Duplicate endpoint URL');
  return { schema_version: 1, service_id: manifest.service_id, revision: manifest.revision, endpoints };
}

/** Trust immutable on-chain creator, NEVER payload publisher, owner or display name.
 * Reject equivocation (duplicate max revision) instead of choosing arbitrarily.
 */
export function selectTrustedManifest(entities, { pinnedPublisher, serviceId, headBlock, allowLoopback = false } = {}) {
  const trusted = normalizeAddress(pinnedPublisher);
  if (!ID.test(serviceId ?? '')) throw new Error('Invalid expected service ID');
  if (typeof headBlock !== 'bigint' || headBlock < 0n) throw new Error('Invalid block height');
  const valid = [], rejected = [];
  for (const entity of entities) {
    const key = typeof entity.key === 'string' ? entity.key : '(unknown)';
    if (!HEX32.test(key)) { rejected.push({ key, reason: 'invalid_key' }); continue; }
    if (!ADDRESS.test(entity.creator ?? '') || entity.creator.toLowerCase() !== trusted) {
      rejected.push({ key, reason: 'untrusted_creator' }); continue;
    }
    if (typeof entity.expiresAt !== 'bigint' || entity.expiresAt <= headBlock) {
      rejected.push({ key, reason: 'expired' }); continue;
    }
    try {
      const a = entity.attributes;
      if (a?.project?.type !== 'str' || a.project.value !== 'relayline-v1' ||
          a?.kind?.type !== 'str' || a.kind.value !== 'manifest' ||
          a?.service_id?.type !== 'str' || a.service_id.value !== serviceId ||
          a?.revision?.type !== 'u64') throw new Error('attributes_mismatch');
      const manifest = validateManifest(entity.data, { serviceId, allowLoopback });
      if (BigInt(manifest.revision) !== a.revision.value) throw new Error('revision_mismatch');
      valid.push({ key, createdAt: entity.createdAt ?? 0n, expiresAt: entity.expiresAt, manifest });
    } catch (error) {
      rejected.push({ key, reason: 'invalid_schema:' + error.message });
    }
  }
  valid.sort((a, b) => b.manifest.revision - a.manifest.revision);
  if (!valid.length) return { selected: null, rejected, issue: 'no_trusted_manifest' };
  if (valid.filter(item => item.manifest.revision === valid[0].manifest.revision).length !== 1) {
    return { selected: null, rejected, issue: 'conflicting_latest_revision' };
  }
  return { selected: valid[0], rejected, issue: null };
}

/** Opt-in CLI probe only. Never expose this as an unauthenticated server endpoint (SSRF). */
export async function probeEndpoint(endpoint, { timeoutMs = 2500, fetchImpl = fetch } = {}) {
  try {
    const response = await fetchImpl(endpoint.url, {
      method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)
    });
    return { id: endpoint.id, role: endpoint.role,
      status: response.status >= 200 && response.status < 400 ? 'reachable' : 'unreachable',
      httpStatus: response.status };
  } catch (error) {
    return { id: endpoint.id, role: endpoint.role, status: 'unreachable', reason: error?.name ?? 'error' };
  }
}

export async function chooseRecovery(manifest, { probe = probeEndpoint } = {}) {
  const primary = manifest.endpoints.find(item => item.role === 'primary');
  const primaryResult = await probe(primary);
  if (primaryResult.status === 'reachable') {
    return { result: 'primary', url: primary.url, probes: [primaryResult] };
  }
  const probes = [primaryResult];
  for (const fallback of manifest.endpoints.filter(item => item.role === 'fallback')) {
    const result = await probe(fallback);
    probes.push(result);
    if (result.status === 'reachable') {
      return { result: 'recovered', url: fallback.url, probes };
    }
  }
  return { result: 'no_reachable_endpoint', url: null, probes };
}
