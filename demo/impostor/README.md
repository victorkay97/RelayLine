# Controlled adversarial demonstration website

`demo/impostor/index.html` is a harmless, independently hosted HTTPS decoy created for G3 of RelayLine's Arkiv hackathon demo.

In a **separate, funded test-only browser wallet**, register the same `service_id=relayline-demo-oct14` but use this site as the fallback destination and `https://relayline-test-primary.vercel.app/` as the primary. The signer MUST differ from the out-of-band pinned legitimate wallet. **Do not import or share private keys.**

A live signed on-chain attacker record is not verified until the second wallet signs and actual transaction hash/entity key are independently inspected. The pinned-root independent reader must reject the fraudulent creator rather than display this decoy link.
