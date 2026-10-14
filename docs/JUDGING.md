# RelayLine — judging evidence matrix

**Updated October 14, 2026; status is factual, NOT a prediction of score.**
Canonical rubric: https://github.com/Arkiv-Network/global-tour-stop-pre-devcon/blob/main/docs/scoring-rubric.md

## Hard-gate readiness

| Gate | Evidence | Status |
| --- | --- | --- |
| Public working deployment | [Publisher](https://relayline-vkalu2266-3185s-projects.vercel.app/), [separately deployed reader](https://relayline-reader.vercel.app/recover.html); Vercel projects READY | PARTIAL — first browser-wallet write and real hosted reader acceptance passed; further browser/device coverage pending |
| Reproducibility | `docs/VALIDATION.md`, `docs/REPRODUCE.md` | PASS — G1/G2/G3/G4 live Arkiv proofs in ONCHAIN_EVIDENCE.md; full third-party reproducibility subject to expiry |
| MIT public repo | [Repository](https://github.com/victorkay97/RelayLine) | PASS |
| `/arkiv/schema.md` | [Data model](../arkiv/schema.md) | PRESENT; live entity examples pending |
| Actual Tiramisu creation addresses | `docs/ONCHAIN_EVIDENCE.md` | **PASS** first real funded test wallet write in block 562737, actual public tx and key in ONCHAIN_EVIDENCE.md |
| `/arkiv/friction.md` | [Developer report](../arkiv/friction.md) | PRESENT; FR-005 documents actual first live write, FR-006 documents second-wallet impersonation |
| Demo video ≤3 minutes | `docs/DEMO.md` | SCRIPT READY; footage/video not recorded |
| Devfolio required fields | `docs/DEVFOLIO_DRAFT.md` | DRAFT; user must submit |
| Built Oct 9–18 | Git commit dates and new RelayLine code | PASS for code written here since Oct 13 |
| Evidence survives expiry | Public tx hashes and video of real entities | Public tx references and CI evidence recorded; demonstration video outstanding |

**Do not claim hackathon eligibility until every hard gate is satisfied.**

## Criterion 1 — Why Censorship Resistance? (25%)

Service operators and their audience are vulnerable to an operator/hosting-provider single point of failure. RelayLine allows an unrelated, independent reader to query publisher-attributable alternative endpoints without calling the original application backend. The user must obtain a publisher wallet through an authenticated channel before failure. A separate Vercel deployment and a runnable CLI demonstrate the independence boundary. That does **not** mean the Arkiv network or fallback endpoint cannot become inaccessible.

## Criterion 2 — Why Arkiv? (25%)

The independent reader and the main application inspect the same shared, public, typed database entities. There is no RelayLine-managed database to trust for service records. On-chain `$creator` protects issuer attribution. Block-based expiry distinguishes long-lived manifests, short-lived monitor measurements and time-limited control records. We deliberately keep monitoring networking, private keys, operational identity verification and TLS endpoint health *off Arkiv*. A single Postgres operator could remove public recovery state; IPFS lacks Arkiv's independently queryable typed live state and native expiry policy.

## Criterion 3 — How Arkiv is used (25%)

- `src/write.mjs`: wallet-signed, versioned manifest entities, typed project/service/revision attributes, 30-day expiry.
- `src/query.mjs`: compound query, consistent pagination, full head-block checks; browser and CLI reuse it.
- `src/policy.mjs`: immutable on-chain creator trust; reject impostor, expired, invalid or equivocal manifests.
- `src/monitor-arkiv.mjs` and `src/monitor-policy.mjs`: 10-minute signed observations, independently trusted monitoring wallet quorums.
- `src/control-arkiv.mjs` and `src/control-policy.mjs`: 90-day root-signed rotations and revocations, local monotonic rollback checks.
- `web/reader.mjs`: independent public queries, user-visible creator validation, endpoint authorization and optional monitoring evidence.

**Note:** SDK read-only queries and **one real wallet-signed manifest creation** are verified on Tiramisu (G1/G2). A controlled outage selected its on-chain fallback (G4), and a second on-chain wallet's impersonation was rejected by the real independent reader (G3). Monitoring/control write implementations are NOT yet proven live. Each user-visible feature must be demonstrated by real entity keys and transaction receipts before it is claimed in the submission.

## Criterion 4 — Friction report (25%)

See `arkiv/friction.md`. Expected/actual/reproduction is provided for successful RPC connection and compound SDK query, including block number and CI run. Once a funded wallet is available, append real published-entity observations, SDK version, chain behavior, creator filtering and expiration. Do not invent SDK defects.

## Track strategy

Primary: **Censorship Resistance**. Open Source and Security are plausible secondaries because a documented data contract and creator verification are shipped, but whether to enter those tracks must depend on independently reproducible evidence. Avoid Privacy claims: Arkiv records and wallet addresses are public, and the product is designed for public service metadata.
