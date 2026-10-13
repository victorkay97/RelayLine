# RelayLine Arkiv schema — validation phase

Target network: Tiramisu, chain ID 7738577; SDK 0.8.x.

## Implemented: manifest

- Indexed attributes: `project: str("relayline-v1")`, `kind: str("manifest")`, `service_id: str(id)`, `revision: u64(number)`.
- JSON payload: `{schema_version:1,service_id,revision,endpoints:[{id,role:"primary"|"fallback",url}]}`.
- Creator trust: the immutable on-chain `$creator`; issuer wallet is pinned **out of band**.
- Creation flags: `readonly: true`, `permissionlessExtension: false`. Owner can still delete.
- Entity Expiration: 30 days for test manifests, as resolved to a block height.
- Query: `select({key:true,creator:true,createdAt:true,expiresAt:true,attributes:true,payload:true}).where(eq("project",str("relayline-v1")),eq("kind",str("manifest")),eq("service_id",str(serviceId))).limit(200).fetch()`.
- Readers MUST check actual creator and the full validated schema, reject expired/mismatched records, walk every page, and fail closed on duplicate highest revision.
- `createdBy(PINNED_PUBLISHER)` is available for regular authenticated discovery; the unfiltered diagnostic query demonstrates attacker rejection.
- Query selection and trust evaluation must share a block snapshot (first query page's `blockNumber`).

## Implemented in code: independent observation (M5, live writes not verified)

- Indexed attributes: `project: str("relayline-v1")`, `kind: str("observation")`, `service_id: str(id)`, `endpoint_id: str(id)`, `status: str("reachable"|"unreachable")`.
- JSON payload: `{schema_version:1,service_id,manifest_key,endpoint_id,endpoint_url,status,observed_at_ms,http_status}`.
- Read-only; 10-minute expiry with `ExpirationTime.fromMinutes(10)`.
- Creator MUST match a monitor wallet independently configured by the reader.
- A report counts only if its manifest key and endpoint URL match the currently trusted publisher manifest, is still active at the snapshot block, and has a timestamp within the 15-minute window (plus 1 minute clock skew).
- At least two independent agreeing trusted monitors are required for a positive/negative health verdict. Conflicting observations are `disputed`; insufficient evidence is `unknown`.
- Operator-only CLI enforces exact HTTPS URL allowlist and public IPv4 DNS lookup pinned for TLS request, without redirects. See `docs/MONITORING.md`.
- Never interpret a monitor claim as proof of censorship. CLI cannot publish without an explicit funded monitor wallet and `MONITOR_PUBLISH=YES`.

## Planned but not yet implemented

- `revocation`: explicitly invalidated manifest/entity from root wallet; necessary before production rollout.
- Safe publisher key rotation and monitor trust policies.

Everything on Arkiv is publicly readable. Do not publish private keys, personal data, authentication credentials or secrets.
