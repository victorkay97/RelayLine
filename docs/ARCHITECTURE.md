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

## Browser implementation (2026-10-13)

The `index.html` publisher console is a static frontend using an injected EIP-1193 wallet; it never asks for or persists a private key. `recover.html` is an independently deployable static reader. Both import browser-safe Arkiv clients from `src/browser-arkiv.mjs`, while Node uses `src/arkiv.mjs`. Shared `src/query.mjs`, `src/write.mjs`, and `src/policy.mjs` prevent protocol divergence.

Reader trust is **opt-in pinned per service ID in localStorage**. A publisher address from an untrusted shared URL is not silently pinned. If an existing pin differs from the entered wallet, discovery fails closed until the user explicitly forgets the old pin. The browser only displays authorized HTTPS links; it cannot reliably verify availability across cross-origin domains because of CORS restrictions.

The publisher shows actual SDK transaction results when signed and confirmed; the independent reader verifies through a new public Arkiv query. The ability to build does not prove live wallet compatibility or user-fundable transactions.
