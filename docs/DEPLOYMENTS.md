# RelayLine deployment and verification record

Updated: **October 13, 2026**. This document distinguishes built/deployed infrastructure from as-yet-unverified wallet-signed Arkiv writes.

## Separate, publicly configured Vercel deployments

| Function | Project | Live URL | Deployment |
| --- | --- | --- | --- |
| Publisher application | `relayline` | https://relayline-vkalu2266-3185s-projects.vercel.app/ | `dpl_75Vi6f9KafT3oXeCMyVL3tRxHLmt` |
| Independent reader | `relayline-reader` | https://relayline-reader.vercel.app/recover.html | `dpl_Fu7hM7MZYX8ACKMwMTBKDVRmuhDM` |

Both Vercel projects report **READY**, each built from `victorkay97/RelayLine` on `main`, commit `984fec1a17495095ee541ea44d44a2655a764b58`. Both have **Vercel Authentication disabled** and **password protection disabled** at the project level. Those are management API findings; a manual external browser visit and wallet-signing interaction have not yet been completed.

The sites are intentionally deployed as **two distinct Vercel projects**, so a publisher app deployment failing does not require the independent reader deployment to fail. At this stage they share the same versioned static build, and each build includes both HTML entry points; a dedicated reader-only release artifact may improve isolation later. The **reader does not call a RelayLine application API**; it issues public Arkiv queries from the browser.

Both projects rely on the same Arkiv public network and external RPC. Two deployments do not guarantee recovery if the RPC is unreachable or all registered fallback endpoints fail.

## Verified CI results

GitHub Actions run: https://github.com/victorkay97/RelayLine/actions/runs/38474448248

- **15 automated tests passed**, including trust selection and mock-based Arkiv query/write adapter tests.
- **Vite production build passed** and produced `dist/index.html` and `dist/recover.html`.
- **Live, read-only Tiramisu RPC and SDK entity-query probes passed** in the same workflow.

A successful frontend build and READY deployment do **not** establish that browser wallet extension signing, entity writes, creator filtering on real manifests or live recovery work. A live on-chain publish is the next acceptance gate.

## Live signing and independent verification: exact manual steps

1. Open the publisher application in a browser with an **EVM-compatible wallet extension**. Use a dedicated **test-only wallet** (not a production or personal funds wallet).
2. Get **test GLM** through Arkiv's official faucet: https://hub.arkiv.network/faucet. Do not paste private keys anywhere.
3. Use **Connect wallet**, verify that Tiramisu chain ID `7738577` is selected, and choose a globally unique lowercase service ID.
4. Register two **controlled HTTPS endpoints** (a primary and a real fallback), set revision to `1`, and approve the testnet transaction.
5. Record the public `$creator` wallet address, transaction hash, entity key and `expiresAt` block shown in the interface.
6. From an independently trusted channel, confirm the publisher wallet identity. Open the reader **on its separate domain**, enter the service ID and publisher wallet, explicitly pin it, and query Arkiv.
7. Verify a matching creator, entity key, revision and expiry block. The reader MUST show **unknown/no trusted manifest**, not an invented endpoint, if the query fails.
8. Perform an impersonation test using **a different test-only funded wallet**, creating a forged high-revision service record. The reader must reject the real `$creator` even if the payload claims the legitimate publisher address.
9. Take the controlled primary endpoint offline; the CLI recovery probe (`node --env-file=.env scripts/read.mjs --probe`) must find the authorized working fallback from the **real on-chain manifest**. A browser link alone does not establish fallback reachability.

Do not use untrusted sites as live probe targets; do not enable automatic URL probing in the browser application (CORS prevents reliable cross-origin measurements). Do not commit private keys or publish any private content to Arkiv.

Acceptance gates and evidence requirements: [Issue #2](https://github.com/victorkay97/RelayLine/issues/2), [validation instructions](./VALIDATION.md).

## M7 reader-only artifact

The original independent Vercel project deployed the full multi-page build. The M7 build introduces a **reader-only static artifact** produced by `npm run build:reader` in `dist-reader/`, containing the direct-RPC client and no publisher HTML entry point. Vercel's `relayline-reader` project must use `npm run build:reader` and output `dist-reader` before this distinction can be claimed for its currently hosted release. Inspect the deployment's commit SHA and `READY` status after changing these settings.

This release packaging change reduces coupling, but it does not guarantee service access if the independent reader's Vercel host or Arkiv RPC is down.

## Reader-only deployment confirmed

At 2026-10-13, the separate `relayline-reader` Vercel project was updated to **build command `npm run build:reader`, output directory `dist-reader`**. Deployment `dpl_6LM3NiAHEUGumRSdiaGXpGGn6wzV` of main commit `e315dabe9954fa1b6bda7b893d43af9fb69b1230` reported `READY`. The separate publisher Vercel project `dpl_2VgWdQEwM5YohP8MoSXMNCQtPBVv` for the same source commit also reported `READY`. An independent external HTTP smoke test is included in the CI workflow to confirm actual public HTTP 200 responses and expected HTML titles; only its actual logs can establish that check has succeeded.

The reader build now produces `dist-reader/index.html` and `dist-reader/recover.html` with no publisher-console HTML entry point. Publishing and signed wallet flows are not tested by this read-only deployment smoke test.
