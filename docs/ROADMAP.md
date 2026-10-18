# RelayLine implementation milestones

- [x] R0 — Initialize public MIT repository and document the trust model.
- [x] R1a — Implement independent pure-policy verifier, offline tests and controlled offline recovery.
- [x] R1b — Tiramisu RPC, real publisher write, independent read, second-wallet impersonation rejection, and controlled live recovery independently validated (G1–G4; see ONCHAIN_EVIDENCE.md).
- [x] R2a — Publisher console and browser wallet signing flows implemented and built.
- [x] R2b — Two live browser-wallet manifest registrations confirmed on Tiramisu (separate wallets and successful public transaction receipts).
- [x] R2c1 — Publisher Workspace v1: wallet-connected read-only portfolio, verified current root authorization, new/update flow, shareable reader links, responsive dashboard and new indigo/persimmon theme.
- [ ] R2c2 — Production account/identity proofs, successor-rotation discovery across unrelated wallets, complete historical index and polished in-browser management of revocation and key recovery.
- [x] R3a — Browser-based direct-RPC reader with explicit wallet pinning and shared trust policy (CI build passed).
- [x] R3b1 — Deploy separately-hosted recovery reader in another Vercel project.
- [x] R3b2 — Prove signed-manifest-backed fallback recovery during controlled primary-service HTTP outage; reader queries Arkiv without RelayLine backend. Full publisher-host outage not separately tested.
- [ ] R3c — Publish and version a minimal reusable read SDK (implementation included in M7 branch; consumer example pending).
- [x] R4a — Monitoring observation schema, independent signer, exact-allowlist HTTPS operator probe and quorum evaluator implemented; tests and live 2-of-2 evidence verified in CI.
- [x] R4b1 — Multiple funded test-wallet identities published actual Tiramisu observations; direct independent Arkiv reader/evaluator observed 2-of-2 reachable quorum at block 735175 (archived in ONCHAIN_EVIDENCE.md).
- [ ] R4b2 — Capture a dedicated hosted-browser UI quorum demonstration (time-limited signed observations); do not claim ongoing monitoring service.
- [ ] R4c — Independently hosted monitor agents with periodic execution and documented operational costs.
- [x] R5a — Publisher revocation, pinned-root single-hop rotation, rollback-fence code and adversarial tests implemented; live signed control transactions verified.
- [x] R5b1 — Validate disposable Wallet B root, Wallet C successor manifest, Wallet B signed epoch-1 rotation, Wallet C signed revocation and fail-closed direct read on live Tiramisu (see ONCHAIN_EVIDENCE.md).
- [ ] R5b2 — Independently review key-compromise recovery, deletion of control entities, cross-device rollback fences and production resilience; the live demo does not constitute a security audit.
- [x] R5c1 — Configurable (not presumed) multi-RPC public read fallback implemented, tested with no secret-bearing URLs.
- [ ] R5c2 — Validate at least two trusted actual Tiramisu RPC providers, durable control replication, multi-hop recovery and independent audit.
- [x] R6a — Publisher and independent-reader public Vercel deployments created.
- [x] R6b — Reproducible synthetic judge demo, independent reader-only build, documented scoring evidence, video storyboard and Devfolio draft prepared (CI builds/tests passed).
- [x] R6c — User-approved real publisher/attacker testnet transactions and controlled signed-manifest recovery evidence documented.
- [ ] R6d — Record ≤3-minute real demo, check all Devfolio links and complete submission.

The R1b gate is a hard prerequisite to claiming Arkiv integration works in a live environment. Timelines do not justify claiming a simulated test is on-chain.
