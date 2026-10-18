# RelayLine Arkiv schema — implemented on Tiramisu

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

## Implemented and live-verified: independent observation (M5)

- Indexed attributes: `project: str("relayline-v1")`, `kind: str("observation")`, `service_id: str(id)`, `endpoint_id: str(id)`, `status: str("reachable"|"unreachable")`.
- JSON payload: `{schema_version:1,service_id,manifest_key,endpoint_id,endpoint_url,status,observed_at_ms,http_status}`.
- Read-only; 10-minute expiry with `ExpirationTime.fromMinutes(10)`.
- Creator MUST match a monitor wallet independently configured by the reader.
- A report counts only if its manifest key and endpoint URL match the currently trusted publisher manifest, is still active at the snapshot block, and has a timestamp within the 15-minute window (plus 1 minute clock skew).
- At least two independent agreeing trusted monitors are required for a positive/negative health verdict. Conflicting observations are `disputed`; insufficient evidence is `unknown`.
- Operator-only CLI enforces exact HTTPS URL allowlist and public IPv4 DNS lookup pinned for TLS request, without redirects. See `docs/MONITORING.md`.
- Never interpret a monitor claim as proof of censorship. CLI cannot publish without an explicit funded monitor wallet and `MONITOR_PUBLISH=YES`.

## Implemented and live-verified: publisher revocation and single-hop key rotation (M6)

### Revocation

- Indexed attributes: `project`, `kind: str("revocation")`, `service_id`, `target_key: str("0x…")`.
- Payload: `{schema_version:1,service_id,target_key,reason:"retired"|"compromised"|"incorrect"}`.
- Signed only by the current authorized publisher, with 90-day entity expiry, read-only flags.
- A revocation of the latest otherwise-valid manifest causes a hard failure; readers **do not** fall back to an earlier revision.

### One-hop rotation

- Indexed attributes: `project`, `kind: str("rotation")`, `service_id`, `epoch: u64(1)`.
- Payload: `{schema_version:1,service_id,successor,min_revision,epoch:1}`.
- Signed by the pinned **root** publisher wallet, names the next publisher signer. Exactly one active root-signed rotation is allowed; conflicting records fail closed. Successor must already publish a valid manifest with revision >= min_revision. This implementation deliberately **does not** support multiple hops.
- Reader makes **one** all-kinds query (`project + service_id`) so manifest, revocation and rotation decisions share the same block snapshot; signed monitor observations can be evaluated from the same query.
- Browser reader pins root wallet out of band and remembers maximum accepted revision, rotation epoch and observed publisher revocations in localStorage. This is a **local rollback fence**, not global indelibility. A new device without trusted history can still be fooled by missing/deleted control records. A record's owner can delete it despite `readonly`.
- CLI `npm run revoke` or `npm run rotate` requires `CONTROL_PUBLISH=YES` and a dedicated test-only wallet. Real root-signed rotation and successor-signed revocation were verified on Tiramisu on 18 October 2026; see `docs/ONCHAIN_EVIDENCE.md` for transaction references, creators, block numbers and fail-closed policy results.

## Planned but not yet implemented

- Multi-hop identity rotation, durable independent archival of controls, continuous separately hosted monitors and stronger monitor reputation. Existing real M5 observations were short-lived and are historical snapshots rather than currently valid endpoint-health evidence.

Everything on Arkiv is publicly readable. Do not publish private keys, personal data, authentication credentials or secrets.


## Public, independently verified chain evidence

- M4: signed manifest, original publisher `$creator`, real attacker-wallet issuer rejection, and controlled primary-failure fallback; see `docs/ONCHAIN_EVIDENCE.md`.
- M5: distinct test wallets B and C published short-lived signed observations. A 2-of-2 reachable quorum was verified at snapshot block `735175`; records have since expired.
- M6: root-authorized one-hop rotation activated successor revision 2. A successor-signed revocation was then correctly rejected as a usable current manifest (`latest_manifest_revoked`, `selected=null`) at block `736262`.

These facts do **not** imply perpetual storage, current monitoring coverage, real-world publisher-domain ownership, or a production security audit.
