# RelayLine — Devfolio submission working draft

**DRAFT — NOT SUBMITTED.** Official questions:
https://github.com/Arkiv-Network/global-tour-stop-pre-devcon/blob/main/docs/submission-checklist.md

## Standard Devfolio fields

**Project name:** RelayLine

**Tagline:** Stay discoverable, even when your service isn't.

**The problem it solves:** A publisher or community can lose its primary website, backend or hosting account, leaving its audience unable to locate an authentic recovery endpoint and vulnerable to look-alike announcements. RelayLine lets the operator publish public recovery manifests directly to Arkiv. Users who have already verified the publisher's wallet can independently retrieve authorized fallback locations through an unrelated client, without trusting RelayLine's hosted application. Signed observations can support freshness checks, while user-facing results distinguish conflicting and missing evidence from health. The product does not claim to prevent all censorship or guarantee that every fallback remains reachable.

**Challenges I ran into:** Capturing consistent entity-query snapshots, designing safe wallet-based publisher bootstrap rather than trusting claimed names, differentiating genuinely current observations from stale evidence, and designing fail-closed revocation behavior even though Arkiv owners can delete records. See the actual expected/observed SDK behaviors and reproducible steps in `arkiv/friction.md`.

**Tracks:** Censorship Resistance (primary). Other tracks must be individually justified before selection.

**Project demo video:** [PENDING — <=3-minute real Tiramisu video]

**Public GitHub repository:** https://github.com/victorkay97/RelayLine

## Arkiv-specific answers

**1. Live app URL:** https://relayline-vkalu2266-3185s-projects.vercel.app/ and independent reader https://relayline-reader.vercel.app/recover.html . Check externally accessible routes again before submitting.

**2. Any team member holds Indian nationality?** [TEAM MEMBER MUST CONFIRM — DO NOT ASSUME]

**3. Why Arkiv?** RelayLine needs a primary record layer that unaffiliated readers can query without relying on the recovery provider's private API, and that attributes each public endpoint manifest to the wallet that actually created it. Arkiv provides a shared typed query surface, immutable `$creator` metadata and built-in expiry for manifests and monitoring claims. A database controlled by the original service owner recreates the single point of failure. IPFS content-addressing alone does not provide Arkiv's application-facing typed queries and active record lifetimes. Monitoring probes, operational private keys and out-of-band proof of publisher identity stay off Arkiv.

**4. How do you use Arkiv?** See `src/write.mjs` (manifest creation), `src/query.mjs` (typed queries and pagination), `src/policy.mjs` (publisher wallet attribution), `src/monitor-arkiv.mjs` (short-lived monitor observations) and `src/control-arkiv.mjs` (revocation/rotation). Only report write-related features as demonstrated after their **actual live transactions** are captured; at present read-only Tiramisu queries are verified, signed writes are pending.

**5. Friction report:** https://github.com/victorkay97/RelayLine/blob/main/arkiv/friction.md

**6. Wallet addresses:** [PENDING — actual Arkiv entity creator wallets from real funded testnet writes, not GitHub user identity]

**7. Schema:** https://github.com/victorkay97/RelayLine/blob/main/arkiv/schema.md

**8. Reproduction:** https://github.com/victorkay97/RelayLine/blob/main/docs/REPRODUCE.md . Steps: reproduce public RPC/SDK query, publish with a test-only publisher wallet, pin the creator in independent reader, reject a second attacker wallet's forged claim, recover from controlled primary outage. **Actual on-chain evidence is still pending.**

**9. Pre-existing work:** The Arkiv core and RelayLine implementation were created during this competition period (Oct 13 onward). Disclose any actual reused pre-Oct-9 components and their baseline SHAs if later introduced. Ordinary third-party frameworks/libraries are listed in package metadata.

**10. Arkiv surfaces:** TypeScript SDK, documentation, Tiramisu public RPC, Block Explorer (when checking actual transactions); faucet only after actually used.

**11. Other:** N/A unless selected.

**12. Time from start to first Arkiv entity write:** [PENDING REAL FIRST WRITE DATE; choose the true duration]

**13. LLMs used:** OpenAI GPT-6 through ChatGPT as a development assistant. [ADD OTHER LLMs ONLY IF ACTUALLY USED]

**14. One improvement Arkiv should prioritize:** [FINALIZE BASED ON REPRODUCED SDK/WRITE FRICTION, not imagined failures]

**15. Open to feedback call?** [TEAM MEMBER MUST CONFIRM]

**16. Originality acknowledgment:** [TEAM MEMBER MUST CONFIRM AFTER AUDIT]

**17. MIT/public-access acknowledgment:** [VERIFY LIVE ALL LINKS ON SUBMISSION DAY]

**18. Devcon attendance:** [OPTIONAL TEAM MEMBER CHOICE]

### Never publish

Private keys, seed phrases, secret API keys, personal addresses, confidential user information, or a fabricated live test result.

### Deadlines

October 18, 2026 at 23:59 **BST = Nigeria time (WAT)**. Keep the published site accessible through October 23 and avoid rewriting Git history after the deadline.
