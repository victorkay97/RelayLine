# RelayLine

**Independent, publisher-authenticated service recovery using Arkiv's Web3 database.**

RelayLine helps users discover authorized recovery endpoints when a primary website becomes unavailable. Service publishers register versioned recovery manifests on Arkiv Tiramisu; an independent reader can query those entities directly without relying on RelayLine's hosted backend.

> **Development status — October 13, 2026:** The architecture is approved for validation. Offline trust-policy tests pass in the existing validation prototype; **live Tiramisu reads, writes, wallet impersonation checks, and on-chain recovery have not been demonstrated**. Do not mistake a simulated local recovery for on-chain validation.

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
