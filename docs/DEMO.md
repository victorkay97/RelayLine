# RelayLine — three-minute judge demonstration plan

**Storyboard only — a video has NOT been recorded.** Runtime target: 165–175 seconds (must be ≤180 seconds). Use real Tiramisu data and screen captures; no simulated green states or fabricated hashes.

| Time | Shot | Narration focus |
| --- | --- | --- |
| 00:00–00:18 | Primary service accessible → controlled outage | "A hosting or availability failure should not erase a trusted way to find a service." |
| 00:18–00:40 | Publisher console, test wallet, verified identity and controlled primary/fallback registration | "An authenticated publisher registers recovery destinations on Arkiv, not a private RelayLine database." |
| 00:40–00:59 | Wallet approval and public transaction hash/entity key | "Here is the actual Tiramisu write and the wallet that created it." |
| 00:59–01:21 | Independent reader on second Vercel deployment, root wallet pinned via out-of-band proof | "The recovery reader performs its own public Arkiv query, without our backend." |
| 01:21–01:41 | Shut down main service; direct reader still discovers authorized live fallback | "When the primary disappears, authenticated discovery still works." |
| 01:41–02:02 | Fraudulent SAME-revision (revision 1) record from another wallet; reader rejects | "A copied display name is not a forged on-chain creator." |
| 02:02–02:24 | Show archived real on-chain B/C signed observations and successful 2-of-2 quorum at block 735175 (explain these short-lived records have expired) | "Independent signed observations can disagree, and old evidence is no longer current." |
| 02:24–02:41 | Root-authorized Wallet B→C rotation, then successor Wallet C's signed revocation; reader shows selected=null | "A compromised endpoint can be withdrawn without silently reverting to stale configurations." |
| 02:41–02:55 | Repo, schema, live queries, friction report, test run | "Everything is open, reproducible, and independently queryable." |

### Footage conditions

- Record **real** public chain keys, wallet addresses and explorer transactions.
- Distinguish archival CI evidence (historical monitoring quorum, controlled primary outage) from present-time live availability. Do not re-enact an old outage by suggesting that the primary is still down.
- Replace any unexecuted sequence with an actual code walkthrough clearly identified as unverified, or remove it to stay honest.
- Do not show private keys, seed phrases, access tokens, paid account details or other user secrets.
- Prioritize the main arc: publisher write → independent read → primary outage → authorized fallback → attacker rejected. The optional monitor/revocation scenes must not crowd this out.
- Produce a final accessible video link and check duration externally. This document is **not** the required video.
