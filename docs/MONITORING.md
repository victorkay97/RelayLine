# Independent monitors — M5

**Implementation complete in code; live signed observations NOT YET VALIDATED.**

### Why monitor records exist

Availability is a property observed outside Arkiv. Each independently operated monitor wallet publishes an attributed, short-lived `observation` entity referencing the selected manifest entity key, service, endpoint ID, exact HTTPS URL, probe result, observed timestamp and optional HTTP status. A signature proves *which monitor wrote* the claim, not its accuracy.

### Operator-only probe

Run `MONITOR_SERVICE_ID=... MONITOR_ENDPOINT_ID=... PINNED_PUBLISHER=0x... MONITOR_APPROVED_URL=https://your-controlled-site.example/ npm run monitor:dry`.
This queries Arkiv for a signed manifest and probes **only** the exact operator-configured URL. Redirects are not followed. Only port 443 and DNS-resolved public IPv4 addresses are allowed. The HTTPS client pins the resolved IPv4 address and verifies TLS against the original hostname, blocking DNS rebinding between the check and connect. The command is **not** a server and must never be exposed as a public URL-probing API.

To publish, run the same script with `MONITOR_PUBLISH=YES` and a funded, **test-only** wallet in `MONITOR_PRIVATE_KEY`. A 10-minute lifetime is configured; each invocation publishes at most one record. No automation is enabled by default; operators choose scheduling and expenses.

### Reader trust

Clients must configure each approved monitor wallet out of band. Do not accept self-declared `monitor_id` or payload wallet strings. The evaluator only counts current entities with actual trusted on-chain `$creator`, matching service, manifest entity key, endpoint ID, and full HTTPS URL. At most one latest unambiguous vote per trusted wallet is counted. Conflicting views are `disputed`. If fewer than two independent trusted wallets agree, the result is `unknown` rather than green.

The optional monitoring result is separate from **authenticated publisher discovery**. A reader can show signed recovery endpoints even if no monitors are configured. A monitor cannot add authorized fallback endpoints.

### Limitations

- A monitor controls what it reports; cryptographic attribution is not proof of truthful measurement.
- A non-2xx/3xx response represents an HTTP health failure in this initial contract. It is **not proof of censorship**.
- A controlled monitor can be offline; expiry automatically removes old observations from active queries. There is no expiration event.
- HTTPS HEAD can fail on otherwise working sites (e.g. 405). Status is `unreachable` in the initial policy and should be interpreted conservatively.
- The public RPC may be rate-limited. Writes cost test GLM and should be scheduled economically.
- Monitor processes must run independently and use separate wallets/networks for meaningful geographic evidence.
