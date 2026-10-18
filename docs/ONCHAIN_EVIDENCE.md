# Verified public Tiramisu evidence — updated 2026-10-18

**Current checkpoint:** M4 G1–G4 PASS; M5 two-wallet live 2-of-2 quorum PASS at historical snapshot block 735175; M6 root manifest, successor, signed rotation and successor-signed revocation/fail-closed reader all PASS. These are time-bounded testnet demonstrations, not claims of perpetual availability or production security certification. The final Devfolio submission and ≤3-minute demo video are separate outstanding deliverables.

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

## G3: Real second-wallet impersonation rejection — PASS

An independent read-only verifier checked the **actual second transaction**, its sender, signed entity's immutable `$creator`, schema, and public service query—not merely a browser screenshot.

| Attribute | Verified Arkiv chain value |
| --- | --- |
| Network | Tiramisu, chain ID `7738577` |
| Second-wallet public address | `0x024e3989ff6ed673c90613815dca3017ab9ea50d` |
| Transaction hash | `0xd25321913a8d03b2356b4d4716f114de0a631bcc7127f5cde7b043dbe791dbf8` |
| Transaction status | `success` |
| Transaction block | `563832` |
| Entity key | `0x2b47b26391ba4d35fa4a481f15b02bc48c7a64d041507152ed54cf32c41231be` |
| Service ID claimed | `relayline-demo-oct14` |
| Revision claimed | `1` |
| Reader snapshot block | `563943` |
| Rejection reason | `untrusted_creator` |
| Legitimate entity retained | `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc` |

**CLI policy and chain evidence:** [GitHub Actions run 38557421557](https://github.com/victorkay97/RelayLine/actions/runs/38557421557). The real record was **signed by a distinct test-only wallet**, while the reader remained pinned to the independently verified legitimate publisher root. The reader explicitly rejected the counterfeit even though the impostor used the same service ID. The test does **not** claim to have tested a higher-revision impersonation: the observed attack revision was 1.

**Hosted UI evidence:** [GitHub Actions run 38557845347](https://github.com/victorkay97/RelayLine/actions/runs/38557845347), Chromium desktop, 375px mobile, and 320px compact. Playwright visited the separately deployed reader, pinned the legitimate publisher, queried live Arkiv, expanded *rejected records*, found `untrusted_creator` for the attack key, confirmed only the legitimate two authorized destinations remained visible, and did not show the attacker’s deliberately unavailable `/offline` URL.

The one-time browser acceptance test is preserved as `test/e2e/m4-live-attacker.spec.mjs` (opt-in `RELAYLINE_LIVE_G3=1`). The corresponding signer check is `scripts/verify-m4-impersonation.mjs`, with public identifiers provided through environment variables. Both records expire eventually; CI does **not** rerun this historical proof on every future commit.

## Additional M5/M6 signed test cases — PENDING

Monitor B/C observations were subsequently proven with a real 2-of-2 quorum on 2026-10-18 (see M5 section below). Root-signed revocation and one-hop rotation still require user-approved, signed live testnet transactions. The automated tests are not substitutes for those receipts.

**Privacy/security:** no signing secrets or seed phrases are included here. The only wallet address shown is a public on-chain testnet identity.

## M5: First live signed monitor observation — Wallet C PASS (2026-10-18)

**Result:** One actual signed `reachable` observation was independently verified. **M5 quorum of two has not yet passed**; current status with only C trusted is `unknown`.

- Monitor wallet C (on-chain immutable creator): `0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e`.
- Real successful tx: `0xa0fc444931ba33b720ee3ea4a30e827952c8e9e5411c67d22fffa536a7d58031` at block `734564`.
- Observation entity: `0xaf1ce413b2274736ce1d180421fae1a066934e4abc6407e66e2cb85fc5862b90`.
- Active at observed snapshot block `734658`; expires at block `734864` (a short-lived monitoring record; do not imply it is still live later).
- Service: `relayline-demo-oct14`, endpoint ID `fallback`, URL `https://relayline-test-fallback.vercel.app/`.
- Signed manifest key `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc` correctly matched the legitimate root-publisher record.
- Observation: `reachable`, reported HTTP 200, 1 recognized trusted signer, **2-of-2 quorum remains `unknown`**.
- Actual independent RPC/CI evidence: [M5 Wallet C GitHub Actions run 39119115149](https://github.com/victorkay97/RelayLine/actions/runs/39119115149); read-only verifier: `scripts/verify-m5-wallet-c.mjs`.

Wallet B must publish an observation while C's record is still unexpired; otherwise both must publish again close together. A valid signer observation is not objective proof of worldwide reachability or censorship resistance.

## M5: Second live signer Wallet B — PASS; 2-of-2 overlap pending (2026-10-18)

- **Actual sender / creator:** `0x024e3989ff6ed673c90613815dca3017ab9ea50d`.
- **Confirmed transaction hash:** `0x2652079f383f1221f1e5c23afc5d3d265de8b6f99f44a4e4dceaa2b5edb9a555`, block `734902`.
- **Observation entity:** `0x2bc06c5c8dbcc7eb91f53f97bdcd5980e19b65575147f7618692ef64b5afd2e4` (created block `734902`, expiry block `735202`).
- **Verified observation:** `fallback`, `reachable`, reported HTTP `200`, legitimate manifest key `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc`.
- **Independent CI evidence:** [GitHub Actions 39119771146](https://github.com/victorkay97/RelayLine/actions/runs/39119771146), verification snapshot block `734952`. Receipt success, transaction sender, immutable creator, typed payload, expiry and trusted manifest verified.
- **Important caveat:** At block `734952`, Wallet C's previous observation (expiring block `734864`) had *already expired*, so only B counted and the actual `fallbackQuorumStatus` was `unknown`. The 2-of-2 real quorum is **NOT YET VERIFIED**. A new Wallet C observation while B remains active is required. Do not misrepresent these separate valid transactions as simultaneous quorum.

## M5: Fresh Wallet C observation + real two-wallet agreement — PASS (2026-10-18)

**Independent read-only proof:** [GitHub Actions run 39120257742](https://github.com/victorkay97/RelayLine/actions/runs/39120257742), timestamp `2026-10-18T10:41:57Z`, Arkiv Tiramisu snapshot block **735175**.

- Wallet B: `0x024e3989ff6ed673c90613815dca3017ab9ea50d`, entity `0x2bc06c5c8dbcc7eb91f53f97bdcd5980e19b65575147f7618692ef64b5afd2e4`, expires at block **735202**. B's signed transaction was separately receipt/creator-verified [in run 39119771146](https://github.com/victorkay97/RelayLine/actions/runs/39119771146).
- Wallet C: `0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e`, newly signed observation entity `0xf95f0e612bdd2275a45d0a547056abcc48878a10ca164cad5ab5774dce70fcfc`, transaction hash reported by publisher CLI `0x02b58c5a5c66a2c8f62aa067aec0e2d9c66db3028199e545a22f29b5f82b3e54`, expires at block **735306**.
- Both on-chain observations were simultaneously active on the **same** legitimate manifest `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc`, endpoint `fallback`.
- The genuine read-only evaluator returned `fallbackQuorumStatus="reachable"`, `verifiedReachableSigners=2`, `rejectedObservationCount=0`, `result="M5_2_OF_2_REACHABLE_QUORUM_CONFIRMED"`.
- This establishes a verified **two-identity on-chain quorum at the recorded block**, *not* that these observations are still valid now, that monitoring is continuously running, or that the wallets were independently hosted or geographically separated.
- CLI and policy proof: `scripts/check-m5-quorum.mjs`. A direct hosted-reader browser assertion specifically for this transient two-monitor quorum has not been archived; separate hosted reader onboarding/identity checks passed earlier in M4.

## M6: Disposable root publisher manifest — PASS (2026-10-18)

**Independent real Arkiv receipt/entity/direct-query verification:** [GitHub Actions run 39120846545](https://github.com/victorkay97/RelayLine/actions/runs/39120846545), 2026-10-18T10:50:59Z.

- **Service ID:** `relayline-m6-oct18` (deliberately separate from the M4/M5 judging demonstration service).
- **Original publisher wallet B / actual immutable creator:** `0x024e3989ff6ed673c90613815dca3017ab9ea50d`.
- **Real successful transaction:** `0x4f18e712705275f1281bb5053623227e5ae7094281d971ac9017235a3a82e75d`, block **735352**.
- **On-chain manifest entity:** `0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91`, expiry block **2031352**.
- **Revision:** 1, `primary=https://relayline-test-primary.vercel.app/`, `fallback=https://relayline-test-fallback.vercel.app/`.
- **Independent reader query:** block **735446**, correctly selected original root-signed manifest and returned `epoch=0`.
- **Historical checkpoint:** At this initial publication, successor, rotation and revocation were pending; all were subsequently verified, as documented below.

## M6: Wallet C successor revision 2 — PASS before rotation (2026-10-18)

**Independent proof:** [GitHub Actions run 39121384917](https://github.com/victorkay97/RelayLine/actions/runs/39121384917), 2026-10-18T10:59:22Z.

- Service: `relayline-m6-oct18`; manifest revision 2.
- Actual Wallet C immutable creator: `0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e`.
- Signed successful transaction: `0x6a25114101fa702d0514c97fb5310ef67e3ad8a56360e0093e49a7e88c959148`, block **735627**.
- On-chain successor entity: `0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1`, expires at block **2031627**.
- Direct read-only Arkiv query at block **735698**: original Wallet B revision-1 entity `0x5a73279e0abe7a2ee450cf2457b7c2617e4a6e1024d03ca8e3a2a95d770b0f91` was still selected at epoch **0**. Wallet C revision-2 manifest was explicitly rejected as **`untrusted_creator`** before any authorization.
- This is the correct, expected fail-closed state before Wallet B signs a successor rotation.
- **Historical checkpoint:** Rotation and revocation had not yet occurred at this stage. They were subsequently performed and independently verified; see later sections.

## M6: Authorized publisher rotation — PASS (2026-10-18)

**Independent signed rotation receipt, immutable creator, and reader transition:** [GitHub Actions run 39122093399](https://github.com/victorkay97/RelayLine/actions/runs/39122093399) at `2026-10-18T11:09:43Z`.

- Original root Wallet B: `0x024e3989ff6ed673c90613815dca3017ab9ea50d`.
- Actual successful Wallet B signed rotation tx: `0x110deaa5d50fc93ed80158e3dae3e4614b877667d99664d0ad32e6c848810b8a`, block **735935**.
- Actual immutable creator Wallet B; rotation entity `0x250d41fb30aa27ca3c44ee77edd373ad177cedcab5e2a385f219f1586e7e0866`.
- Rotation authorizes Wallet C `0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e`, epoch **1**, minimum manifest revision **2**.
- Independent direct Arkiv query at block **736008** selected Wallet C's exact revision-2 entity `0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1`, `issue=null`, activeSigner Wallet C.
- Before rotation this same revision was correctly rejected as `untrusted_creator`; the authorization *changed* the reader's decision without changing the out-of-band pinned root.
- **Historical checkpoint:** At this snapshot the successor was active. Wallet C subsequently signed its revocation, and the reader failed closed as evidenced below.

## M6: Successor-signed revocation and fail-closed read — PASS (2026-10-18)

**Independent read-only verification:** [GitHub Actions run 39122663682](https://github.com/victorkay97/RelayLine/actions/runs/39122663682), Arkiv snapshot block **736262**, timestamp **2026-10-18T11:18:11Z**.

| Check | Actual on-chain result |
| --- | --- |
| Chain | Arkiv Tiramisu, ID `7738577` |
| Service ID | `relayline-m6-oct18` (isolated disposable security test) |
| Active successor Wallet C / immutable revocation creator | `0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e` |
| Successful Wallet C revocation transaction | `0x4ed2e6e916d4d3f16960d02d7080f5da6d526657032a95349ecd706c089a5444` |
| Transaction block | **736179** |
| Revocation entity | `0x6b9c0e7fa75056b1f320778a208021f3a05be052d62cf695f24fdf7fd3a697a1` |
| Signed revocation target | `0x42884b4c0edb63f3231b003f0ae669c3621c9016bb20b6871548ec13b18f05b1` (Wallet C manifest revision 2) |
| Signed reason | `retired` |
| Verified reader epoch / active signer | **1** / Wallet C |
| Reader issue | **`latest_manifest_revoked`** |
| Reader selected manifest | **`null`** (fail-closed) |
| Original Wallet B manifest | Rejected as `untrusted_creator`; not silently restored |

The verifier `scripts/verify-m6-revocation.mjs` checked actual receipt status and `from`, immutable `$creator`, typed `revocation` attributes, payload/target, original root-signed rotation, independent Arkiv query, and reader resolution after revocation. This is real transaction-backed behavior, **not** a mock. The earlier [rotation proof](https://github.com/victorkay97/RelayLine/actions/runs/39122093399) shows the exact same Wallet C manifest was accepted before revocation.

**Limitations:** Control entities expire and may be removable by their owner; clients that have never observed the revocation are not universally rollback-resistant if those records disappear. A compromised trust root remains a separate concern. The demo therefore establishes *correct reader decisions at observed chain snapshots*, not permanent irrevocability or an external security audit. The M4/M5 legitimate service was deliberately untouched.
