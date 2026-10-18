# RelayLine — judging evidence matrix

**Updated October 18, 2026; status is factual, NOT a prediction of score.**
Canonical rubric: https://github.com/Arkiv-Network/global-tour-stop-pre-devcon/blob/main/docs/scoring-rubric.md

## Hard-gate readiness

| Gate | Evidence | Status |
| --- | --- | --- |
| Public working deployment | [GitHub Pages home](https://victorkay97.github.io/RelayLine/), [workspace](https://victorkay97.github.io/RelayLine/workspace.html), [reader](https://victorkay97.github.io/RelayLine/recover.html), [docs](https://victorkay97.github.io/RelayLine/docs.html); optional [independently hosted reader](https://relayline-reader.vercel.app/recover.html) | PARTIAL — first browser-wallet write and real hosted reader acceptance passed; further browser/device coverage pending |
| Reproducibility | `docs/VALIDATION.md`, `docs/REPRODUCE.md` | PASS — G1/G2/G3/G4 live Arkiv proofs in ONCHAIN_EVIDENCE.md; full third-party reproducibility subject to expiry |
| MIT public repo | [Repository](https://github.com/victorkay97/RelayLine) | PASS |
| `/arkiv/schema.md` | [Data model](../arkiv/schema.md) | PRESENT; live entity examples pending |
| Actual Tiramisu creation addresses | `docs/ONCHAIN_EVIDENCE.md` | **PASS** real M4, M5 and M6 signed transactions and entity addresses in ONCHAIN_EVIDENCE.md |
| `/arkiv/friction.md` | [Developer report](../arkiv/friction.md) | PRESENT; FR-005/006/007/008 cover actual publication, identity filtering, signed monitor agreement, and control records |
| Demo video ≤3 minutes | `docs/DEMO.md` | SCRIPT READY; footage/video not recorded |
| Devfolio required fields | `docs/DEVFOLIO_DRAFT.md` | DRAFT; user must submit |
| Built Oct 9–18 | Git commit dates and new RelayLine code | PASS for code written here since Oct 13 |
| Evidence survives expiry | Public tx hashes and video of real entities | Public tx references and CI evidence recorded; demonstration video outstanding |

**Do not claim hackathon eligibility until every hard gate is satisfied.**

## Criterion 1 — Why Censorship Resistance? (25%)

Service operators and their audience are vulnerable to an operator/hosting-provider single point of failure. RelayLine allows an unrelated, independent reader to query publisher-attributable alternative endpoints without calling the original application backend. The user must obtain a publisher wallet through an authenticated channel before failure. An optionally separate read-only Vercel deployment and a runnable CLI demonstrate the hosting-independence boundary; the canonical GitHub Pages reader shares a host with the workspace, though it queries Arkiv without the publisher backend. That does **not** mean the Arkiv network or fallback endpoint cannot become inaccessible.

## Criterion 2 — Why Arkiv? (25%)

The independent reader and the main application inspect the same shared, public, typed database entities. There is no RelayLine-managed database to trust for service records. On-chain `$creator` protects issuer attribution. Block-based expiry distinguishes long-lived manifests, short-lived monitor measurements and time-limited control records. We deliberately keep monitoring networking, private keys, operational identity verification and TLS endpoint health *off Arkiv*. A single Postgres operator could remove public recovery state; IPFS lacks Arkiv's independently queryable typed live state and native expiry policy.

## Criterion 3 — How Arkiv is used (25%)

- `src/write.mjs`: wallet-signed, versioned manifest entities, typed project/service/revision attributes, 30-day expiry.
- `src/query.mjs`: compound query, consistent pagination, full head-block checks; browser and CLI reuse it.
- `src/policy.mjs`: immutable on-chain creator trust; reject impostor, expired, invalid or equivocal manifests.
- `src/monitor-arkiv.mjs` and `src/monitor-policy.mjs`: 10-minute signed observations, independently trusted monitoring wallet quorums.
- `src/control-arkiv.mjs` and `src/control-policy.mjs`: 90-day root-signed rotations and revocations, local monotonic rollback checks.
- `web/reader.mjs`: independent public queries, user-visible creator validation, endpoint authorization and optional monitoring evidence.

**Live validation update (2026-10-18):** M4 G1–G4 transaction-backed validation passed, including a controlled fallback and real impersonator record rejection. M5 separate Wallet B/C on-chain observations achieved 2-of-2 signed reachable agreement at historical block **735175**, without claiming continuously hosted monitors. M6 root-signed epoch-1 rotation activated a successor revision-2 manifest; successor-signed revocation then yielded `latest_manifest_revoked`, selected `null` at block **736262**. Actual receipts, immutable creators and direct-reader decisions are archived in [ONCHAIN_EVIDENCE.md](ONCHAIN_EVIDENCE.md). These validations are not an independent security audit or proof of absolute censorship resistance.

## Criterion 4 — Friction report (25%)

See `arkiv/friction.md`. Expected/actual/reproduction is provided for successful RPC connection and compound SDK query, including block number and CI run. FR-005 through FR-008 now include actual public transaction-backed observations and reproducible read-only verification. Do not invent SDK defects.

## Track strategy

Primary: **Censorship Resistance**. Open Source and Security are plausible secondaries because a documented data contract and creator verification are shipped, but whether to enter those tracks must depend on independently reproducible evidence. Avoid Privacy claims: Arkiv records and wallet addresses are public, and the product is designed for public service metadata.
