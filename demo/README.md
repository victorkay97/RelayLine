# M4 controlled HTTPS endpoints
These are harmless, static websites for reproducible tests. Both sites are intended for independent Vercel projects with the GitHub repository connected. They do not publish Arkiv records, sign transactions, run monitors or request wallet secrets.

* `demo/primary/index.html`: healthy home page (HTTP 200 expected). A deliberately *missing* `/offline` path should return HTTP 404 and is reserved as the controlled, preconfigured unavailable endpoint.
* `demo/fallback/index.html`: independent healthy fallback site (HTTP 200 expected).

Use a test-only service ID such as `relayline-demo-oct14` with a verified publisher wallet and these two HTTPS URLs. A browser/CLI recovery client should select the authorized fallback after the primary returns 404. This is a controlled **unavailable URL** demonstration, not evidence of real government censorship or a real hosting outage. More realistic failure-injection can come later.

The sites intentionally contain no authentication, API keys, user data, cookies or dynamic backends. They are never part of the trust root: on-chain `$creator` attribution establishes publisher authority after out-of-band wallet verification.
