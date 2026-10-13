# Tiramisu technical-validation gates

**Status:** Real read-only Tiramisu RPC connectivity **PASS** in GitHub Actions (2026-10-13; chain 7738577, block 539118; see [evidence](./LIVE_READ_EVIDENCE.md)). Four live-manifest acceptance gates are still pending; the offline policy tests pass. The submission must not claim that any live gate has passed without actual transaction references.

## Prerequisites

- Node 22+, npm, internet, Tiramisu RPC; two **test-only** wallets funded with test GLM.
- Funding: https://hub.arkiv.network/faucet .
- Copy `.env.example` to gitignored `.env`; fill in URLs you control.
- Do not post private keys into ChatGPT, GitHub, CI, or recordings.
- `npm install` and `npm test`, then `npm run probe:rpc`.

With Node 22+, load the local test environment using `node --env-file=.env scripts/<script>.mjs`. Never use production wallet keys.

| Gate | Exact evidence required | Current state |
| --- | --- | --- |
| G1 real publish | Tiramisu chain ID, block number, publisher address, entity key and transaction hash | NOT VERIFIED |
| G2 independent read | Reader loads Tiramisu entity without RelayLine backend, matching publisher and payload | NOT VERIFIED |
| G3 impersonation | Separate attacker wallet successfully writes a record; reader rejects it via actual creator | NOT VERIFIED |
| G4 recovery | Primary synthetic website intentionally down; registered fallback working; live manifest read via Arkiv | NOT VERIFIED |

## Execution

1. `node --env-file=.env scripts/probe-rpc.mjs` — confirm chain 7738577 and block.
2. `node --env-file=.env scripts/publish.mjs publisher` — capture the resulting receipt, address and key.
3. Set `PINNED_PUBLISHER` to the known publisher address obtained **out of band**.
4. `node --env-file=.env scripts/read.mjs` — confirm the authorized manifest from live Arkiv data.
5. With `REVISION=999`, a separate funded attacker wallet and a controlled fake endpoint, run `node --env-file=.env scripts/publish.mjs attacker`.
6. Repeat `node --env-file=.env scripts/read.mjs`. Expect `untrusted_creator` among rejections while the legitimate manifest stays selected.
7. Point the manifest at two synthetic HTTPS services you control; deliberately disable the primary. `node --env-file=.env scripts/read.mjs --probe` must select the registered reachable fallback. Probes are **local and opt-in**.
8. Attach redacted logs and receipts to the validation report. Never commit .env or private keys.

## Limitations and blockers

- GitHub Action read-only probe does **not** fund wallets or demonstrate writes.
- Offline fixtures are identified as `OFFLINE_FIXTURE_NOT_ARKIV`.
- An endpoint's HTTPS reachability does not prove it is safe or uncensored.
- New publishers must establish the root-wallet identity out of band.
- Production must implement revocation, key recovery/rotation, monitor verification, RPC failover, and hosted-probe SSRF defenses.
- Max of 2,000 matching manifests accepted in this validation CLI; larger sets fail closed.
