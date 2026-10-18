# RelayLine Arkiv developer friction report (verified observations and reproducible tests)

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

**Limitation (at the time of FR-005):** This validates a controlled failed URL, not actual censorship. Real attacker, signed monitor and control tests were later completed, as documented in FR-006 through FR-008. No SDK bug is claimed from successful tests.

## FR-006 — Real impostor creator filtering (2026-10-14)

**Environment:** Arkiv Tiramisu 7738577, two user-authorized test-only EVM wallets, SDK 0.8.1 verifier on GitHub-hosted Ubuntu Node 22.

**Expected:** Another wallet can publish the same service identifier, but an independently authenticated and pinned publisher wallet must not be replaced by that record. The reader should expose a clear `untrusted_creator` rejection.

**Observed:** **PASS**. Second-wallet transaction `0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8` in block 563832 created entity `0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be` with immutable creator `0x024e3989ff6ed673c90613815dca3017ab9ea50d`; service `relayline-demo-oct14`, revision **1**. The independent query at block 563943 found and rejected the entity for `untrusted_creator`, continuing to select the first legitimate entity. Browser E2E accepted the legitimate endpoints and listed the rejection on desktop, mobile and compact views.

**Reproduce:** `ATTACKER_ADDRESS=0x024e3989ff6ed673c90613815dca3017ab9ea50d ATTACKER_TX_HASH=0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8 ATTACKER_ENTITY_KEY=0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be node scripts/verify-m4-impersonation.mjs`, while both entities are active. [Read-only verifier log](https://github.com/victorkay97/RelayLine/actions/runs/38557421557). [Hosted UI acceptance log](https://github.com/victorkay97/RelayLine/actions/runs/38557845347). This successful result does not establish an SDK defect or broader censorship resistance.

## FR-007 — Real signed short-lived monitor observations and Node HTTPS preflight (2026-10-18)

**Environment:** Node 22 Linux GitHub Actions runner and Windows developer CLI; public Tiramisu RPC chain 7738577; HTTPS allowlisted fallback test website. Two disposable wallets with publicly verifiable `$creator`.

**Expected:** Monitor writes should be accepted with funded test-wallet gas; observation records should be short-lived and individually attributed. Policy requires two agreeing active trusted monitor identities before reporting `reachable`, otherwise `unknown`.

**Actual:** An initial Linux dry-run surfaced a Node 22+ `lookup({all:true})` return-shape mismatch in RelayLine's own pinned HTTPS probe code; we fixed it to return array data when requested, and the dry-run passed HTTP 200. This was an **application integration bug, not an Arkiv SDK defect**. Subsequently Wallet B and C signed actual on-chain observations. On independent public query block **735175**, the evaluator returned `verifiedReachableSigners=2`, `rejectedObservationCount=0`, `fallbackQuorumStatus=reachable`. Their records expired normally, so earlier/later single-wallet snapshots returned `unknown`.

**Reproduce/evidence:** [M5 preflight](https://github.com/victorkay97/RelayLine/actions/runs/39115016291), [signed B observation](https://github.com/victorkay97/RelayLine/actions/runs/39119771146), [signed C observation](https://github.com/victorkay97/RelayLine/actions/runs/39119115149), [2-of-2 quorum snapshot](https://github.com/victorkay97/RelayLine/actions/runs/39120257742). Code `scripts/check-m5-quorum.mjs`; snapshot is historical rather than guaranteed reproducible after expiry. Test wallets are distinct signers, **not** independently hosted monitors.

## FR-008 — Root-authorized successor rotation and active-manifest revocation (2026-10-18)

**Environment:** Public Tiramisu chain 7738577; original Wallet B root, successor Wallet C, disposable service `relayline-m6-oct18`. Reader pins Wallet B out-of-band, then checks actual immutable creator and active control entities.

**Expected:** A higher-revision manifest published by Wallet C is untrusted before root approval. After Wallet B signs an epoch-1 one-hop rotation, reader should select Wallet C's revision 2. Once Wallet C revokes that active entity, reader should refuse recovery, not fall back to old Wallet B revision 1.

**Actual:** Pre-rotation proof [run 39121384917](https://github.com/victorkay97/RelayLine/actions/runs/39121384917) rejected Wallet C as `untrusted_creator`. Root signed rotation tx `0x110deaa5d50fc93ed80158e3dae3e4614b877667d99664d0ad32e6c848810b8a` (block 735935); reader activated epoch 1 / Wallet C revision 2 at block **736008** ([run 39122093399](https://github.com/victorkay97/RelayLine/actions/runs/39122093399)). Successor signed revocation tx `0x4ed2e6e916d4d3f16960d02d7080f5da6d526657032a95349ecd706c089a5444` (block 736179), targeting `0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1`. At block **736262**, reader showed `issue=latest_manifest_revoked`, `selected=null`, no rollback to Wallet B's old record ([run 39122663682](https://github.com/victorkay97/RelayLine/actions/runs/39122663682)).

**Interpretation and limitation:** The SDK worked for the tested transactions; no SDK fault is claimed. Control deletion/expiry and root compromise remain security limitations. This records observed chain snapshots, not permanent revocation or production key-recovery guarantees.
