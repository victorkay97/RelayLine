import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const required=['docs.html','web/home.mjs','web/docs.mjs','LICENSE','arkiv/schema.md','arkiv/friction.md',
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


test('publisher controls exist only in workspace and docs is a production entry',async()=>{
 const [home,workspace,docs,vite]=await Promise.all(['index.html','workspace.html','docs.html','vite.config.mjs'].map(x=>readFile(x,'utf8')));
 assert.doesNotMatch(home,/id="publisher-form"|id="setup"|web\/publisher\.mjs/);
 assert.match(workspace,/id="publisher-form"/);
 assert.match(home,/href="\.\/docs\.html"/);
 assert.match(docs,/id="trust"/);
 assert.match(vite,/docs: resolve\(root, 'docs\.html'\)/);
});

test('noncanonical Vercel projects do not autodeploy from GitHub',async()=>{
 const config=JSON.parse(await readFile('vercel.json','utf8'));
 assert.equal(config.git?.deploymentEnabled,false);
});
