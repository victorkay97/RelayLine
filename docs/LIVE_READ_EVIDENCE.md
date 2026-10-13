# Read-only Arkiv Tiramisu connectivity — observed evidence

**Observed:** 2026-10-13 21:46:29 UTC
**GitHub Actions run:** https://github.com/victorkay97/RelayLine/actions/runs/38473061758
**Workflow:** `RelayLine validation`; job `Read-only Tiramisu connectivity`
**Ref:** PR #1 integration test
**Runner:** GitHub-hosted Ubuntu, Node 22.23.3, npm 10.9.9

From the completed GitHub Actions job, the command `npm run probe:rpc` returned:

```json
{
  "result": "PASS",
  "stage": "read_only_rpc",
  "rpc": "https://rpc.tiramisu.db-chain.testnet.arkiv.network",
  "chainId": 7738577,
  "block": "539118",
  "startedAt": "2026-10-13T21:46:28.750Z"
}
```

**Interpretation:** Real public RPC connectivity and read-only chain methods have been validated from this external runner. That is more than documentation-only feasibility. However it **does not** prove entity creation, querying an actual RelayLine manifest, wallet-creator filtering, or fallback recovery using a live Arkiv entity.

**Other job:** Offline trust policy tests: 9/9 passed; separate local recovery fixture passed and was explicitly marked `OFFLINE_FIXTURE_NOT_ARKIV`.

**Next evidence:** G1 publish via funded test wallet; G2 read a real manifest; G3 adversarial second-wallet write; G4 live-manifest-backed fallback recovery. Store public transaction hashes/entity keys here when known. Do not commit wallet private keys.
