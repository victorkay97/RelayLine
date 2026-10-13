# RelayLine security model — M6

**Last reviewed 2026-10-13.** These are implemented controls and explicitly documented limitations, not a third-party security audit and not a statement of completed on-chain transactions.

## Threat boundaries

| Adversary | Protection | Remaining limitation |
| --- | --- | --- |
| Fake publisher name/URL | Reader must already have an out-of-band pinned publisher root. `$creator` is checked, not a payload `publisher` field. | The original root identity must be authenticated correctly before pinning; Arkiv does not certify organization identity. |
| Forged recovery manifest from another wallet | Reader discards unauthorized on-chain creators. | A compromised legitimate wallet can still publish apparently authentic data. |
| Unauthorized revocation | Only controls created by the active authorized publisher wallet are considered. | The legitimate signer can revoke service information maliciously or accidentally. |
| Wrong-signer rotation | Only the pinned root can authorize a one-hop successor via a valid Arkiv `rotation` entity. Conflicting active root rotations fail closed. | A compromised root can issue a fraudulent rotation; multi-hop is not implemented. |
| Manifest rollback | Browser persists maximum accepted revision and epoch for the pinned service in localStorage. | New devices start without history; clearing local storage loses the fence. |
| Revocation deletion | Browser caches verified revocation keys locally and rejects them on subsequent reads. | New readers cannot recover deleted revocation data from current Arkiv state, so revocation is **not irrevocable**. |
| Fake monitoring status | Require out-of-band monitor allowlist and immutable `$creator`; two independent agreeing wallets required for the configured quorum. | Wallet identities do not prove monitors report the truth or represent distinct networks. |
| Probe SSRF | No public monitoring endpoint; exact allowlist, public-IPv4 DNS check, pinned lookup and verified TLS hostname, no redirects. | Operator-controlled URL verification and isolated workers are still required; no public-probe hosting is authorized. |
| Missing Arkiv query page | Reader fails closed on incomplete pagination or changed snapshot block; caps result size. | Public query may be DoS'd by spam using the public project/service identifiers. |
| RPC outage or malicious RPC | Direct Arkiv query without RelayLine app backend; chain ID checked. | Public RPC availability and correct chain state are assumed. No light-client proof validation. |

## Revocation lifecycle

A `revocation` is an immutable, signed assertion from the effective publisher authorizing retirement of an earlier manifest. The reader verifies the record's *actual creator*, query attributes, payload, active expiry, service ID and target entity key. A revoked latest revision is treated as **no trusted recovery manifest**: an older manifest cannot silently become valid again.

Control records are readable by anyone and expire after 90 days, so a deletion or expiry can make a revocation invisible to brand-new readers. An existing browser remembers verified revocations, but this is not universal or tamper-proof storage. **Do not promise permanent revocation or absolute censorship resistance.**

Run a revocation locally with a funded test-only root wallet; never store signing keys in CI:
```bash
CONTROL_PUBLISH=YES SERVICE_ID=service-id REVOKE_ENTITY_KEY=0x... REVOKE_REASON=compromised \
node --env-file=.env scripts/revoke.mjs
```

## Safe, deliberately limited root rotation

A pinned root wallet can issue **one** signed successor assignment (`epoch=1`) for a service. Before publishing the rotation, the successor wallet should publish a higher-revision valid manifest. The rotation states a minimum accepted successor revision. Once recognized, readers accept only the successor's manifests and controls; they no longer choose root-authored manifests. Multiple competing active root rotations, invalid rotation attributes or missing successor manifests cause fail-closed behavior.

Only a **single hop** is implemented. The root signer cannot recover from a root compromise by merely asserting another record; compromised keys can themselves authorize malicious changes. A successor change for a production service needs additional independent identity recovery and better cross-device continuity guarantees.

To publish an intentional rotation:
```bash
CONTROL_PUBLISH=YES SERVICE_ID=service-id NEW_PUBLISHER_ADDRESS=0x... MIN_SUCCESSOR_REVISION=2 \
node --env-file=.env scripts/rotate.mjs
```

The above commands **require** a configured, funded, user-controlled test-only signing wallet and explicit operator confirmation in their environment. Neither is executed automatically by CI.

## Product security posture

- Never collect secret keys in the browser app or store them in GitHub.
- All records on Arkiv are publicly readable; publication is not a privacy feature.
- The independent reader accepts only HTTPS destination URLs and opens them with `rel="noopener noreferrer"`.
- A verified *publisher* authorizes an endpoint; it does not attest to the endpoint's safety, TLS content, or current reachability.
- The browser does not run arbitrary on-chain scripts or generic HTTP probes.
- Before production: stronger cross-device rollback resistance, distributed archive of control records, domain/identity proofs, rate/abuse controls, RPC failover, external security audit, honest browser-wallet transaction tests.

See [architecture](ARCHITECTURE.md), [Arkiv schema](../arkiv/schema.md), and [live test gates](VALIDATION.md).

## Read-only RPC resilience

`src/rpc-transport.mjs` accepts 1–4 explicitly configured HTTPS Tiramisu RPC URLs, deduplicates them, rejects credential-bearing/query-token URLs and uses viem fallback transport for read-only queries. No imaginary second Arkiv endpoint is bundled. By default only the official public RPC is configured and **there is no actual failover capacity**. Endpoint operators must separately verify chain authenticity and availability; a matching chain ID alone does not prove honest state or provide light-client verification. Signed publication continues through one explicitly chosen trusted signer RPC.
