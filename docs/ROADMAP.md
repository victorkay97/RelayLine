# RelayLine implementation milestones

- [x] R0 — Initialize public MIT repository and document the trust model.
- [x] R1a — Implement independent pure-policy verifier, offline tests and controlled offline recovery.
- [ ] R1b — Validate Tiramisu RPC, real publisher write, independent read, attacker write and live recovery.
- [x] R2a — Publisher console and browser wallet signing flows implemented (CI build passed; on-chain publishing unverified).
- [ ] R2b — Live browser signing tested and confirmed on Tiramisu.
- [ ] R2c — Production publisher management: revocation, key recovery and approvals.
- [x] R3a — Browser-based direct-RPC reader with explicit wallet pinning and shared trust policy (CI build passed).
- [x] R3b1 — Deploy separately-hosted recovery reader in another Vercel project.
- [ ] R3b2 — Prove publisher outage recovery using a LIVE on-chain manifest.
- [ ] R3c — Publish and version a minimal reusable read SDK.
- [x] R4a — Monitoring observation schema, independent signer, exact-allowlist HTTPS operator probe and quorum evaluator implemented; tests pending GitHub CI.
- [ ] R4b — Multiple distinct funded monitor wallets publish actual Tiramisu observations; independent reader displays live quorum results.
- [ ] R4c — Independently hosted monitor agents with periodic execution and documented operational costs.
- [x] R5a — Immutable publisher revocations, pinned-root single-hop rotation, local revision/epoch rollback fences and adversarial tests implemented; live signing pending.
- [ ] R5b — Validate real revocation and successor writes on Tiramisu; document and review key compromise recovery.
- [ ] R5c — RPC failover, durable control replication, multi-hop recovery and external security audit.
- [ ] R6 — End-to-end demo, live deployment, reproducibility package, submission video, and complete hackathon documentation.

The R1b gate is a hard prerequisite to claiming Arkiv integration works in a live environment. Timelines do not justify claiming a simulated test is on-chain.
