import { publishManifest } from '../src/arkiv.mjs';
const role = process.argv[2];
if (!['publisher', 'attacker'].includes(role)) {
  console.error('Usage: npm run publish -- publisher|attacker');
  process.exit(2);
}
const manifest = {
  schema_version: 1,
  service_id: process.env.SERVICE_ID ?? 'relayline-gate',
  revision: Number(process.env.REVISION ?? 1),
  endpoints: [
    { id: 'home', role: 'primary', url: process.env.PRIMARY_URL ?? 'https://primary.example.org/' },
    { id: 'recovery', role: 'fallback', url: process.env.FALLBACK_URL ?? 'https://recovery.example.org/' }
  ]
};
try {
  const privateKeyEnv = role === 'publisher' ? 'PUBLISHER_PRIVATE_KEY' : 'ATTACKER_PRIVATE_KEY';
  const evidence = await publishManifest({
    privateKeyEnv, manifest, allowLoopback: process.env.ALLOW_LOOPBACK_TESTS === '1'
  });
  console.log(JSON.stringify({ result: 'PASS', action: 'publish_' + role, ...evidence }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', action: 'publish_' + role, error: error.message }, null, 2));
  process.exitCode = 1;
}
