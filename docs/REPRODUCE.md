# Reproduce RelayLine's Arkiv usage

For independent judges, without a RelayLine API key or private backend.

## Public read-only checks (already executed on Tiramisu)

```bash
git clone https://github.com/victorkay97/RelayLine.git
cd RelayLine
npm install
npm test
npm run build
npm run build:reader
npm run probe:rpc
npm run probe:query
```

`probe:rpc` should identify Tiramisu chain ID **7738577**. `probe:query` executes a real typed `project = str("relayline-v1")` query and prints its actual block and record keys. The previously recorded live SDK query returned **zero records**, because no writes had been made at that time. Zero is a valid query result, not proof of recovery. Reference: `docs/LIVE_READ_EVIDENCE.md`.

## Pure local fixture — does NOT use Arkiv

```bash
npm run demo:judge
```

The fixture launches an intentionally disabled loopback primary, an available local fallback, a forged publisher record, two synthetic monitor statements and a simulated signed revocation. Output explicitly identifies `OFFLINE_SIMULATION_NOT_LIVE_ARKIV`.

## Real testnet recovery (M4–M6 evidence already recorded)

1. Fund a new test-only wallet with test GLM via https://hub.arkiv.network/faucet; never publish its signing secret.
2. Open the [canonical publisher workspace](https://victorkay97.github.io/RelayLine/workspace.html), connect a compatible test-only wallet, and (only if actually testing a **new** publication) approve a manifest registration with one controlled working fallback. **The original M4 publisher transaction is already proven in ONCHAIN_EVIDENCE.md; new writes are not needed just for judges to examine its receipt.**
3. Record **public** publisher address, transaction hash and entity key in `docs/ONCHAIN_EVIDENCE.md` after verifying them on the Tiramisu explorer.
4. Open the separately hosted [independent reader](https://relayline-reader.vercel.app/recover.html). Authenticate the publisher wallet out-of-band before pinning. Query the service and compare the real returned entity key, creator, revision and expiry.
5. Inspect the existing **real second-wallet impersonation transaction** and creator check in `docs/ONCHAIN_EVIDENCE.md`; the independent reader rejected that signed record as `untrusted_creator`. If you reproduce with fresh funded test wallets, use unique synthetic IDs and do not treat a forged display attribute as a legitimate creator.
6. Examine the recorded **historical** G4 proof of a deliberately unavailable controlled primary (HTTP 404) and an authorized fallback (HTTP 200) in `docs/ONCHAIN_EVIDENCE.md`. To reproduce the outage anew, operate only synthetic HTTPS endpoints you control and follow the documented allowlist and probe rules; the primary has since been restored.

The validation protocol and completed public transaction proofs are in `docs/VALIDATION.md` and `docs/ONCHAIN_EVIDENCE.md`. Expired M5 monitor evidence and revoked M6 state are historical, not currently reachable results. Final Devfolio readiness: `docs/SUBMISSION_HANDOFF.md`. Avoid private user or organization data in public Arkiv entities.

## Read-client independence

The reader is built with `npm run build:reader`; its release artifact contains the reader HTML/JS and shared Arkiv read modules but no publisher console HTML/JS. You can host these static files without contacting RelayLine's first-party API. If the publisher host fails while the reader site, Arkiv RPC and at least one authorized recovery endpoint remain up, the reader can still discover a published fallback.

**This architecture does not provide universal censorship circumvention, endpoint safety, DNS identity proof, irreversible revocation or chain availability guarantees.**
