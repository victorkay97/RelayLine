# RelayLine public protocol v1 — implement a compatible reader

There is no private RelayLine API contract. A third party can query Arkiv Tiramisu using `@arkiv-network/sdk` 0.8.x or the public JSON-RPC interface. The repo provides an MIT-licensed `src/reader-sdk.mjs` plus the complete `examples/third-party-reader.mjs` and human-readable `arkiv/schema.md`.

## Required trust bootstrap

A client must know `service_id` and a **publisher root wallet independently authenticated while the publisher is still accessible**. A payload `publisher` property or the claimed service name proves nothing. Do not auto-pin the address supplied in a shared query string.

## Entity discovery

Connect to Tiramisu chain ID `7738577`, query entities with two indexed constraints:
```ts
const result = await client.select({
  key: true, creator: true, createdAt: true,
  expiresAt: true, attributes: true, payload: true
}).where(
  eq('project', str('relayline-v1')),
  eq('service_id', str(serviceId))
).limit(200).fetch();
```
Use cursor pagination (up to 2,000 entities in this reference implementation), reject incomplete results or changed snapshot blocks. The same snapshot includes `kind=manifest`, `kind=rotation`, `kind=revocation`, and `kind=observation`.

## Verification procedure

1. Filter expired entities using their **actual chain** `expiresAt` relative to the query block, and verify typed attributes against payload data.
2. Check the record's immutable on-chain **creator**, not its mutable owner or claimed organization.
3. If one valid root-signed one-hop rotation exists, use its successor wallet and reject competing rotations; otherwise use the pinned root signer. A verified existing client's monotonic epoch fence prevents reverting to the root silently.
4. Find the unique highest valid manifest revision signed by the selected wallet. A tie fails closed. Reject revisions below an already accepted watermark or a rotation's minimum.
5. Verify all authorized HTTPS primary/fallback endpoints against the manifest contract, then process authorized-signer revocations. If the highest version is revoked, return **no authorized endpoint** rather than falling back.
6. Monitor evidence is optional and never controls endpoint authorization. Only explicitly allowed, independently attributed monitor wallet statements count. If fresh evidence is insufficient, show `unknown`; if it conflicts, show `disputed`.
7. Return the accepted entity key, wallet address and expiry block. Warn that an authorized endpoint may still be unreachable, unsafe, or censored on the user's network.

## Minimal reader

```js
import { createPublicClient } from '@arkiv-network/sdk';
import { tiramisu } from '@arkiv-network/sdk/chains';
import { http } from 'viem';
import { readAuthorizedService } from './src/reader-sdk.mjs';

const client = createPublicClient({chain:tiramisu,transport:http()});
const state = await readAuthorizedService({
  client,serviceId:'demo',pinnedPublisher:'0x...'
});
if(state.decision.selected) console.log(state.decision.selected.manifest.endpoints);
```

## Limitations for compatible clients

Arkiv has no permanent record retention guarantee for deleted/expired controls, and does not promise HTTP endpoint reachability. A brand-new reader may not know a revoked record the owner deleted. Root key compromise is not solved by blockchain attribution alone. Multi-hop rotation is deliberately not supported in v1. Do not infer global censorship from a local HTTP failure.

## Evidence

A clean, reproducible Tiramisu manifest publication and independent reader execution are still required before this protocol is called field-validated. SDK query connectivity has been independently verified in CI.
