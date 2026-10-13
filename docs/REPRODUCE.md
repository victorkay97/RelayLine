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

## Real testnet recovery (waiting for a funded test wallet)

1. Fund a new test-only wallet with test GLM via https://hub.arkiv.network/faucet; never publish its signing secret.
2. Open the [publisher console](https://relayline-vkalu2266-3185s-projects.vercel.app/), connect a compatible wallet and approve a testnet manifest registration with one controlled working fallback.
3. Record **public** publisher address, transaction hash and entity key in `docs/ONCHAIN_EVIDENCE.md` after verifying them on the Tiramisu explorer.
4. Open the separately hosted [independent reader](https://relayline-reader.vercel.app/recover.html). Authenticate the publisher wallet out-of-band before pinning. Query the service and compare the real returned entity key, creator, revision and expiry.
5. Publish a forged higher-revision manifest using a **different** funded test-only wallet. Query again. The independent client must reject that record by its immutable creator.
6. Disable the controlled primary server and run `node --env-file=.env scripts/read.mjs --probe` locally against a known HTTPS fallback, with the legitimate publisher pinned. It should select the authorized reachable fallback.

The complete validation protocol and remaining gates are in `docs/VALIDATION.md` and GitHub Issue #2. Avoid private user or organization data in public Arkiv entities.

## Read-client independence

The reader is built with `npm run build:reader`; its release artifact contains the reader HTML/JS and shared Arkiv read modules but no publisher console HTML/JS. You can host these static files without contacting RelayLine's first-party API. If the publisher host fails while the reader site, Arkiv RPC and at least one authorized recovery endpoint remain up, the reader can still discover a published fallback.

**This architecture does not provide universal censorship circumvention, endpoint safety, DNS identity proof, irreversible revocation or chain availability guarantees.**
