# RelayLine Arkiv developer friction report (working log)

**2026-10-13 — not a completed hackathon friction submission.** Record actual, reproducible observations only.

## FR-001 — Execution sandbox cannot resolve RPC DNS

**Environment:** Container runner, Node 22.x. **Expected:** External DNS and access to the public Tiramisu RPC.
**Observed:** `curl -I https://rpc.tiramisu.db-chain.testnet.arkiv.network` failed with `Could not resolve host` during this session.
**Interpretation:** The container's external connectivity is restricted. This is **not** an observed Arkiv SDK or network defect.
**Reproduce:** Run the same curl command in the restricted container; repeat from an external runner with `npm run probe:rpc`.
**Action:** A read-only GitHub Actions connectivity probe is added to CI. Record its logs separately.

## FR-002 — Planned conformance checks (not yet executed on Tiramisu)

- Verify `createEntity` receipt, `entityKey`, transaction hash and block expiry.
- Compare `createdBy()` filtering with independently checking `$creator`.
- Verify cursor pagination is snapshot-consistent and handles stale cursors.
- Verify entity expiration by reading before and after the expiry block.
- Verify `readonly` patch rejection and that the owner can still delete.
- Record SDK version, wallet **addresses only**, exact inputs, tx references and observed outcomes.

## Provenance warning

Local `node --test` and `npm run demo:offline` validate **pure policy logic and synthetic fixtures only**. They do not prove successful RPC communication, live transactions, or decentralized recovery. Never invent transaction hashes or live results.

## FR-003 — Successful read-only Arkiv SDK entity query (verified)

**Environment:** GitHub-hosted Ubuntu, Node 22, SDK 0.8.x, 2026-10-13 21:48:55 UTC.
**Expected:** Public Tiramisu SDK `select().where(eq("project",str("relayline-v1"))).limit(5).fetch()` works without a funded wallet.
**Observed:** PASS, block 539191, zero matching records, no query errors. Expected at this stage because no manifest exists yet.
**Reproduction:** `npm install && npm run probe:query`; see GitHub Actions run https://github.com/victorkay97/RelayLine/actions/runs/38473350225.
**Interpretation:** Successful query path, not evidence of Arkiv entity writes. No issue reported.

## M5 monitoring status
M5 code includes 10-minute observation expiry, on-chain creator policy and a controlled HTTPS probe. Offline/mocked tests will be recorded in CI. **Do not present these as evidence of actual funded monitor transactions** until their hashes exist.

## FR-004 — Compound query and `createdBy()` — test pending observation

Automated read-only probe: `npm run probe:friction`, pinned SDK `0.8.1`, Node 22. It compares the return of a typed compound query against the same query with `createdBy(dummyWallet)`, confirms the chain ID and checks that returned entities (if any) match the creator filter. The query uses a unique synthetic service ID and prints **counts only**, never third-party payloads.

**Expected:** both queries execute against Tiramisu, produce a BigInt snapshot block, and the creator filter cannot yield records created by another wallet.
**Actual (observed 2026-10-13 22:29:30 UTC):** PASS on chain `7738577`, first snapshot block `540409`, elapsed `636 ms`, SDK `0.8.1`; both queries returned **zero entities**, `hasNextPage=false`, and the filtered result contained no creator mismatches. The result proves query syntax, remote execution, page metadata and method wiring; **it does NOT prove that a positive matching `$creator` record is returned correctly**, since there are no matches yet. Evidence: https://github.com/victorkay97/RelayLine/actions/runs/38478108830, job `Read-only Tiramisu connectivity` (`probe:friction`). No SDK defect was observed. A funded publisher entity will allow positive-match verification later.
**Reproduce:** `npm install && npm run probe:friction`.

## FR-005 — First real wallet-signed manifest creation and independent recovery (2026-10-14)

**Environment:** Arkiv Tiramisu chain 7738577, public publisher wallet `0x2d7cfff67d9e63e225e082371b205cb7518b5c24`; browser wallet authorization, public SDK 0.8.1 verifier on GitHub Actions.

**Expected:** A signed read-only `manifest` write yields a successful transaction, 32-byte entity key, immutable creator matching signer, typed query consistency, readable public payload and active expiration. Separate client should retrieve entity and verify it with no RelayLine backend. After controlled primary failure, recovery should select registered fallback.

**Observed:** **PASS**. Transaction `0x009368bc762eb37da627842823584a3d644d41db7278582106f7c9273637b7e1`, creation block 562737, entity key `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc`, expiry block 1858737. Read-only verifier selected the exact on-chain entity at block 562847. During separately controlled primary HTTP 404 failure, the live on-chain manifest's fallback answered HTTP 200 and recovery was selected at query block 562972.

**Reproduction:** `npm install && node scripts/verify-m4-publication.mjs` while record is active; see [G1/G2 workflow](https://github.com/victorkay97/RelayLine/actions/runs/38553133526). The controlled outage script `scripts/verify-m4-recovery.mjs` succeeds only when the primary test fixture is temporarily offline; see [G4 workflow](https://github.com/victorkay97/RelayLine/actions/runs/38553629942). The primary fixture was restored afterward.

**Limitation:** This validates a controlled failed URL, not actual censorship. A separate attacker's real on-chain creation remains pending, as do monitor and control signed writes. No SDK bug is claimed from these successful tests.

## FR-006 — Real impostor creator filtering (2026-10-14)

**Environment:** Arkiv Tiramisu 7738577, two user-authorized test-only EVM wallets, SDK 0.8.1 verifier on GitHub-hosted Ubuntu Node 22.

**Expected:** Another wallet can publish the same service identifier, but an independently authenticated and pinned publisher wallet must not be replaced by that record. The reader should expose a clear `untrusted_creator` rejection.

**Observed:** **PASS**. Second-wallet transaction `0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8` in block 563832 created entity `0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be` with immutable creator `0x024e3989ff6ed673c90613815dca3017ab9ea50d`; service `relayline-demo-oct14`, revision **1**. The independent query at block 563943 found and rejected the entity for `untrusted_creator`, continuing to select the first legitimate entity. Browser E2E accepted the legitimate endpoints and listed the rejection on desktop, mobile and compact views.

**Reproduce:** `ATTACKER_ADDRESS=0x024e3989ff6ed673c90613815dca3017ab9ea50d ATTACKER_TX_HASH=0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8 ATTACKER_ENTITY_KEY=0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be node scripts/verify-m4-impersonation.mjs`, while both entities are active. [Read-only verifier log](https://github.com/victorkay97/RelayLine/actions/runs/38557421557). [Hosted UI acceptance log](https://github.com/victorkay97/RelayLine/actions/runs/38557845347). This successful result does not establish an SDK defect or broader censorship resistance.
