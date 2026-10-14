# Complete live G3 with a second test-only wallet

**First live M4 proofs already passed:** G1 publisher transaction, G2 independent browser/SDK recovery and G4 controlled HTTP outage. See [ONCHAIN_EVIDENCE.md](ONCHAIN_EVIDENCE.md).

A G3 live counterfeiting test requires an actual **different** wallet to sign a publicly queryable Arkiv entity. This is a security test of the immutable on-chain creator, not an attempt to deceive anyone.

## Fast browser-only execution

1. In an EVM wallet such as MetaMask, create **a second separate test-only account**. Never import any production wallet or share the seed phrase.
2. Fund that account with a small amount of test GLM using https://hub.arkiv.network/faucet (if available; faucet may rate-limit).
3. Re-open the publisher application at https://relayline-vkalu2266-3185s-projects.vercel.app/ and connect **the second wallet address** on Tiramisu 7738577.
4. Choose the **same service ID** `relayline-demo-oct14`. Use two distinct harmless test URLs to simulate an unauthorized replacement, e.g. primary `https://relayline-test-primary.vercel.app/` and fallback `https://relayline-test-primary.vercel.app/offline` (deliberately HTTP 404) so the payload differs from the legitimate backup.
5. Review and approve a **second public testnet transaction**. The registration is not proof of ownership of that service name; a reader must reject it unless its `$creator` matches the independently pinned legitimate wallet.
6. Share only the second wallet's **public address, transaction hash, and entity key**. Do not share secrets.

## Verify without a signing key

```sh
ATTACKER_ADDRESS=0xPUBLIC_SECOND_WALLET \
ATTACKER_TX_HASH=0xPUBLIC_TX_HASH \
ATTACKER_ENTITY_KEY=0xPUBLIC_ENTITY_KEY \
node scripts/verify-m4-impersonation.mjs
```

This read-only script obtains the real receipt/entity from Arkiv, checks that `receipt.from` equals the separate wallet, validates the signed payload and attributes, then queries the full service and requires `untrusted_creator` for the attacker key while still selecting the legitimate entity `0x2389c184908191a0b751396e135f64c1ceb3e2d827cbc5849d1a2ff442a7d2fc`.

**Don't claim G3 PASS before this script validates actual second-wallet receipts.** The test used only public blockchain identifiers. The optional dedicated decoy Vercel project could not be deployed on 2026-10-14 because Vercel reported `api-deployments-free-per-day` quota exhaustion; the existing controlled HTTPS URLs are sufficient for a valid impersonation test without a new deployment.
