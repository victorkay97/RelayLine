# RelayLine implementation milestones

- [x] R0 — Initialize public MIT repository and document the trust model.
- [x] R1a — Implement independent pure-policy verifier, offline tests and controlled offline recovery.
- [ ] R1b — Validate Tiramisu RPC, real publisher write, independent read, attacker write and live recovery.
- [x] R2a — Publisher console and browser wallet signing flows implemented (build verification pending; on-chain publishing unverified).
- [ ] R2b — Live browser signing tested and confirmed on Tiramisu.
- [ ] R2c — Production publisher management: revocation, key recovery and approvals.
- [x] R3a — Browser-based direct-RPC reader with explicit wallet pinning and shared trust policy (build verification pending).
- [ ] R3b — Deploy independent recovery reader separately and validate publisher-app outage.
- [ ] R3c — Publish and version a minimal reusable read SDK.
- [ ] R4 — Independent observation workers, evidence freshness, monitor trust, and full lifecycle handling.
- [ ] R5 — Revocation, safer identity rotation, RPC failover and adversarial security review.
- [ ] R6 — End-to-end demo, live deployment, reproducibility package, submission video, and complete hackathon documentation.

The R1b gate is a hard prerequisite to claiming Arkiv integration works in a live environment. Timelines do not justify claiming a simulated test is on-chain.
