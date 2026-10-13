import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const required=['LICENSE','arkiv/schema.md','arkiv/friction.md',
 'docs/SECURITY.md','docs/REPRODUCE.md','docs/DEMO.md',
 'docs/DEVFOLIO_DRAFT.md','docs/ONCHAIN_EVIDENCE.md',
 'docs/JUDGING.md','src/query.mjs','src/policy.mjs'];
test('competition-gate documents and core modules are present',async()=>{
 for(const path of required)assert.ok((await stat(path)).isFile(),path);
});
test('repository includes MIT licence and no fake chain write evidence',async()=>{
 const licence=await readFile('LICENSE','utf8');
 assert.match(licence,/MIT License/);
 const evidence=await readFile('docs/ONCHAIN_EVIDENCE.md','utf8');
 assert.match(evidence,/pending/i);
});
