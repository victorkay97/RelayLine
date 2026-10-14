# Verified public Tiramisu evidence — 2026-10-14

## G1: Real publisher write — PASS

Independent public RPC query and transaction receipt verification:
https://github.com/victorkay97/RelayLine/actions/runs/38553133526

| Attribute | Verified Arkiv chain value |
| --- | --- |
| Chain | Tiramisu (7738577) |
| Publisher wallet / immutable `$creator` | `0x2d7cfff67d9e63e225e082371b205cb7518b5c24` |
| Transaction hash | `0x009368bc762eb37da627842823584a3d644d41db7278582106f7c9273637b7e1` |
| Transaction status | `success` |
| Transaction sender (`from`) | Same as publisher wallet |
| Creation/transaction block | `562737` |
| Entity key | `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc` |
| Entity expiry block | `1858737` |
| Service ID | `relayline-demo-oct14` |
| Revision | `1` |
| Record kind | `manifest`, project `relayline-v1` |
| Primary | https://relayline-test-primary.vercel.app/ |
| Fallback | https://relayline-test-fallback.vercel.app/ |

The test checked **actual** `getTransactionReceipt()`, `getEntity()`, chain ID, creator, expiry, typed attributes and valid manifest payload. Verified at query block **562847**, 2026-10-14T10:57:27Z.

## G2: Independent chain query/creator policy — PASS

In the same [CI evidence](https://github.com/victorkay97/RelayLine/actions/runs/38553133526), `src/query.mjs` executed a fresh direct Arkiv query for the service, and `src/control-policy.mjs` resolved its publisher root. The selected entity key matched the provided real entity key exactly. One record was returned; no competing records yet. As a defensive negative control, a *different pinned wallet* did not accept the record. **This negative control is not a real attacker-wallet publication**.

**Hosted browser G2 acceptance ALSO PASSED:** Playwright opened the separately deployed public reader at https://relayline-reader.vercel.app/, pinned the legitimate publisher in the UI, queried Arkiv directly, and confirmed the real selected entity key and fallback URL. Tested in three Chromium viewport configurations (desktop, 375px mobile, 320px compact) in [GitHub Actions run 38554197291](https://github.com/victorkay97/RelayLine/actions/runs/38554197291). The special live E2E test is gated behind `RELAYLINE_LIVE_M4=1` so the test suite does not break when the 30-day entity naturally expires.

## G4: Actual on-chain manifest-backed controlled outage recovery — PASS

Evidence: https://github.com/victorkay97/RelayLine/actions/runs/38553629942
Timestamp: **2026-10-14T11:01:36Z**.
Reader query snapshot block: **562972**.

- Directly read the **same real publisher-signed entity** from Tiramisu with no RelayLine application backend.
- Verified that the two on-chain HTTPS endpoints exactly matched our controlled test-domain allowlist before any network probing.
- Temporarily deployed a missing-index fixture for the primary host so the signed primary root URL returned **HTTP 404**.
- Independently confirmed the signed fallback root returned **HTTP 200**.
- `chooseRecovery()` returned `recovered` and selected https://relayline-test-fallback.vercel.app/ .
- This is a controlled unavailable-URL outage, **not proof of censorship, a true provider shutdown, global reachability or endpoint safety**. The publisher's real on-chain record was not modified for the test.
- The primary fixture was subsequently restored via Vercel git deployment `dpl_BBug35JovgxMYJs3dTLEL9vSEPPM`, reporting `READY`. A follow-up HTTP test checks restoration.

## G3: Second-wallet attack publication — PENDING

No independently signed attacker entity has yet been received/verified. Do not treat the mismatched-pin negative control as a successful live G3.

**Attacker evidence required:** second funded test-only wallet address, actual Tiramisu transaction hash, actual entity key and evidence that the reader scans the attacker's service record but rejects its immutable `$creator` while retaining the legitimate publisher record. Attackers should use a harmless owned HTTPS decoy, not an unrelated real site.

## Additional M5/M6 signed test cases — PENDING

Monitor A/B independent wallet observations, root-signed revocation and one-hop rotation still require user-approved test-only transaction(s). The automated mock tests and architecture are not substitutes for a live receipt.

**Privacy/security:** no signing secrets or seed phrases are included here. The only wallet address shown is a public on-chain testnet identity.
