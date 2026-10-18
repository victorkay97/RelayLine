# Tiramisu technical-validation gates

**Status (2026-10-14):** G1 real publisher write, G2 independent chain reader verification, and G4 signed-manifest-backed controlled outage recovery are **PASS** with actual public transaction/entity references. G3 actual attacker-wallet publication and rejection is also **PASS**. All four core M4 gates are verified. Source of truth: [ONCHAIN_EVIDENCE.md](./ONCHAIN_EVIDENCE.md).

## Prerequisites

- Node 22+, npm, internet, Tiramisu RPC; two **test-only** wallets funded with test GLM.
- Funding: https://hub.arkiv.network/faucet .
- Copy `.env.example` to gitignored `.env`; fill in URLs you control.
- Do not post private keys into ChatGPT, GitHub, CI, or recordings.
- `npm install` and `npm test`, then `npm run probe:rpc`.

With Node 22+, load the local test environment using `node --env-file=.env scripts/<script>.mjs`. Never use production wallet keys.

| Gate | Exact evidence required | Current state |
| --- | --- | --- |
| G1 real publish | Tiramisu chain ID, block number, publisher address, entity key and transaction hash | **PASS** (block 562737) |
| G2 independent read | Reader loads Tiramisu entity without RelayLine backend, matching publisher and payload | **PASS** (CI block 562847; hosted-browser test separate) |
| G3 impersonation | Separate attacker wallet successfully writes a record; reader rejects it via actual creator | **PASS** (block 563832, rejected at query block 563943) |
| G4 recovery | Primary synthetic website intentionally down; registered fallback working; live manifest read via Arkiv | **PASS** (CI block 562972, primary HTTP 404, fallback HTTP 200) |

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

## Current reproducible checks

- `node scripts/verify-m4-publication.mjs`: read-only real transaction, entity, immutable creator, compound query and pinned trust policy. This permanent public test fixture expires at Arkiv block 1858737; do not interpret future expected expiry as a chain regression.
- `node scripts/verify-m4-recovery.mjs`: read-only allowlisted fallback validation. **Only run while the controlled primary fixture is intentionally unavailable**, or the test correctly reports `primary` rather than `recovered`.
- GitHub Actions logs: [G1/G2](https://github.com/victorkay97/RelayLine/actions/runs/38553133526) and [G4](https://github.com/victorkay97/RelayLine/actions/runs/38553629942).
- G3 was completed with a real second funded test wallet and independent immutable-creator rejection. Public addresses, transaction hashes and entity keys are in ONCHAIN_EVIDENCE.md; never share private keys.

## G3 signed identity impersonation evidence (complete)

- Attacker wallet `0x024e3989ff6ed673c90613815dca3017ab9ea50d`, real transaction `0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8` and entity key `0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be`.
- [Independent on-chain proof](https://github.com/victorkay97/RelayLine/actions/runs/38557421557) (receipt, creator, payload, direct query and `untrusted_creator` rejection).
- [Hosted browser proof](https://github.com/victorkay97/RelayLine/actions/runs/38557845347) (desktop/mobile/compact acceptance).
- All four M4 gates G1–G4 verified using real testnet publication records and a controlled primary outage. M5 two-wallet live quorum and M6 single-hop rotation / revocation were **subsequently verified** on 2026-10-18 with real transaction-backed evidence (ONCHAIN_EVIDENCE.md). This is **not** production security certification or broad censorship-resilience proof.
