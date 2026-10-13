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
