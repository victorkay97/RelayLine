# RelayLine

**Independent, publisher-authenticated service recovery using Arkiv's Web3 database.**

RelayLine helps users discover authorized recovery endpoints when a primary website becomes unavailable. Service publishers register versioned recovery manifests on Arkiv Tiramisu; an independent reader can query those entities directly without relying on RelayLine's hosted backend.

> **Development status — October 13, 2026:** Live read-only Tiramisu RPC and SDK entity queries pass; offline policies are covered by automated tests. **Real wallet-signed RelayLine entity writes, a forged on-chain manifest, and live manifest-backed recovery have NOT been validated.** Do not confuse offline fixtures or a deployed UI with successful on-chain writes.

## Initial release objective

1. A publisher signs and publishes a service manifest on Tiramisu.
2. A separate client reads it directly from Arkiv using a previously pinned publisher wallet.
3. An attacker wallet cannot impersonate the real publisher by placing a wallet address in payload attributes.
4. When the primary service is unavailable, the independent reader identifies an authorized reachable fallback.
5. Relevant entity keys, transactions, block heights, and reproduction steps are documented.

## Competition

Arkiv: Global Tour Stop (October 9–18, 2026). Primary pillar: **Censorship Resistance**. The open-source implementation is MIT licensed. Official rules: https://github.com/Arkiv-Network/global-tour-stop-pre-devcon

## Trust boundaries

A signed Arkiv record proves which wallet created it, **not** that it belongs to the claimed organization. Users must pin a publisher wallet through an independently authenticated channel. Monitoring reports are observations, not proofs of censorship. Arkiv is an external availability dependency. A publisher may delete an entity even when it is read-only.

## Source, testing and documentation

The validation implementation will be proposed on a feature branch for review. The repository will include `arkiv/schema.md`, `arkiv/friction.md`, and separately documented local versus live-chain test evidence.

No wallet private keys should be shared in chat, issues, pull requests, CI logs, or committed files.

## Browser publisher console and independent reader

The **publisher console** is a static, client-side wallet application. It requests a compatible EVM wallet, switches to Arkiv Tiramisu, validates a public recovery manifest and asks the wallet to sign `createEntity`. **No wallet private key is handled by the web application or RelayLine servers.**

The **independent recovery reader** is a separately built static entry page (`recover.html`). It calls the Arkiv public RPC directly, requires an explicitly pinned publisher wallet and applies the same auditable trust policy as the CLI. It displays authorized endpoints but does **not** claim browser-based cross-origin reachability.

```bash
npm install
npm test
npm run build
npm run dev
```

Open `http://localhost:5173/` for publishing and `http://localhost:5173/recover.html` for reading. To demonstrate independence, deploy the generated reader and shared assets on a different host from the publisher console. The reader must not depend on RelayLine's application backend.

Writing requires a wallet funded with **test GLM** through Arkiv's official faucet. **Live publisher writes and reader authentication remain unverified until transaction evidence is recorded.** Offline unit tests and a successful read-only Arkiv query are not equivalent to publishing.

See `docs/VALIDATION.md`, `docs/LIVE_READ_EVIDENCE.md`, and [open live validation gates](https://github.com/victorkay97/RelayLine/issues/2).

## M5 independent monitoring and M6 control records (code-complete, chain writes unverified)

The reader can apply a quorum of independently pinned monitor wallets to short-lived observation entities. A monitor process can probe one explicitly operator-allowlisted HTTPS endpoint and optionally sign the result using a test-only wallet. Health can be `reachable`, `unreachable`, `disputed`, `unknown` or `not_configured`. It is never proof of censorship.

The reader also supports publisher-signed manifest revocations and a single-hop root-signed key rotation. Revoked latest manifests fail closed. Local epoch/revision watermarks reduce rollback from subsequently deleted control entities, but **cannot guarantee protection to a brand-new reader**. See `docs/MONITORING.md` and `docs/SECURITY.md`.

To publish a revocation or rotation from the test-only CLI, explicitly set `CONTROL_PUBLISH=YES` and the appropriate public identifiers. This is **not** required for dry-run automated tests and must not be placed into CI.

## Hackathon judging and independent reproduction

- Publisher console: https://relayline-beta.vercel.app/
- Independently hosted read-only client: https://relayline-reader.vercel.app/
- Run `npm run build:reader` to produce a standalone `dist-reader/` static site.
- Run `npm run demo:judge` for an explicit **offline synthetic** failure/recovery, attacker, monitor and revocation demonstration.
- Read `docs/JUDGING.md`, `docs/REPRODUCE.md`, `docs/DEMO.md` and `docs/ONCHAIN_EVIDENCE.md`.
- The mandatory demo video and real Arkiv creation-transaction evidence are still pending.

## Read-only RPC resilience

The optional `ARKIV_RPC_URLS` (CLI) or `VITE_ARKIV_RPC_URLS` (browser build) can specify up to four vetted HTTPS RPC URLs. Read clients use viem fallback transport across configured endpoints. **Only one real endpoint is bundled; actual failover needs a separately verified second RPC.** Do not put API-key URLs or secrets into static builds.
