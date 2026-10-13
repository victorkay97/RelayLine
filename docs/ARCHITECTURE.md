# RelayLine architecture decision record — 2026-10-13

## Goal

Independent discovery of authorized fallback endpoints after primary-service failure. Primary Arkiv hackathon pillar: **Censorship Resistance**.

## Trust model

Publishers sign on-chain creation transactions. The independent reader learns the root publisher wallet from an authenticated out-of-band channel, queries manifests on Tiramisu, verifies the immutable `$creator`, validates typed attributes and payload, and selects a single highest revision. Duplicate maximum revisions fail closed rather than introducing arbitrary tie-breaking.

Trusting the on-chain creator is **not** sufficient to determine which wallet belongs to a particular real-world organization. That assertion needs out-of-band verification. Compromised keys can sign malicious but apparently authentic records. A read-only entity can still be deleted by its owner.

## Separation of duties

- `src/policy.mjs`: pure manifest and endpoint validation; trusted-source filtering and recovery selection.
- `src/arkiv.mjs`: real public/wallet SDK clients, read/write entity operations.
- `scripts/publish.mjs`: test-wallet signed writes (explicit invocation only).
- `scripts/read.mjs`: no dependency on the RelayLine application backend.
- `scripts/offline-demo.mjs`: separate synthetic local fixture, never misreported as Tiramisu evidence.
- CI: dependency-free policy tests; distinct read-only RPC connectivity job.

## Known compromises for the validation stage

Manifest revocation and key rotation not implemented. No distributed monitoring yet. Probe code is opt-in and MUST NOT be exposed as a publicly callable URL fetcher. External RPC availability remains a dependency; service fallback itself cannot guarantee access when Arkiv or fallback infrastructure is unavailable. Browser client, product UI, and deployment remain separate future milestones.

## Evidence standard

Report LIVE only when there is an actual Tiramisu transaction or read result. Retain creator addresses, entity keys, block heights, SDK versions and reproducible steps. Do not fabricate operational results.
