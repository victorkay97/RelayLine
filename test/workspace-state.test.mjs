import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPortfolioDecision } from '../web/workspace-state.mjs';

const B='0x024e3989ff6ed673c90613815dca3017ab9ea50d';
const C='0xe9949b46262a98210bd1e4ab9ac525ac055a2d1e';

test('self-signed same-service impostor is never described as globally authenticated',()=>{
 const result=classifyPortfolioDecision({selected:{key:'0x'+'a'.repeat(64)},activeSigner:B,epoch:0,issue:null},B);
 assert.equal(result.status,'active');
 assert.match(result.issue,/NOT proof.*independently trusted publisher/i);
});
test('successor rotation is labeled transferred and original wallet cannot manage',()=>{
 const result=classifyPortfolioDecision({selected:{key:'0x'+'b'.repeat(64)},activeSigner:C,epoch:1,issue:null},B);
 assert.equal(result.status,'rotated');
 assert.match(result.issue,/no longer update/i);
});
test('revocation takes precedence over successor-rotation status and explains no recovery',()=>{
 const result=classifyPortfolioDecision({selected:null,activeSigner:C,epoch:1,issue:'latest_manifest_revoked'},B);
 assert.equal(result.status,'revoked');
 assert.match(result.issue,/No recovery destination is currently selected/);
});
test('ambiguous/invalid service state must request review',()=>{
 const result=classifyPortfolioDecision({selected:null,epoch:0,issue:'conflicting_root_rotation'},B);
 assert.equal(result.status,'review');
 assert.match(result.issue,/conflicting_root_rotation/);
});
