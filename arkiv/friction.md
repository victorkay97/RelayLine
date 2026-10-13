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
