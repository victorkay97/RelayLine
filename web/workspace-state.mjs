import {normalizeAddress} from '../src/policy.mjs';

/**
 * A wallet can create a valid manifest for ANY service ID.
 * Never label that as globally authenticated ownership.
 * A public reader still requires a separately authenticated pinned root.
 */
export function classifyPortfolioDecision(decision, walletAddress) {
 const wallet=normalizeAddress(walletAddress);
 if(decision?.issue==='latest_manifest_revoked') {
   return {
     status:'revoked',
     issue:'The authorized signer revoked the latest manifest. No recovery destination is currently selected; these URLs are historical only.'
   };
 }
 if(decision?.epoch>0 && decision.activeSigner && normalizeAddress(decision.activeSigner)!==wallet){
   return {
     status:'rotated',
     issue:'Publisher authority was transferred to a successor wallet. This wallet can no longer update the service.'
   };
 }
 if(decision?.selected && decision.activeSigner && normalizeAddress(decision.activeSigner)===wallet){
   return {
     status:'active',
     issue:'Signed by this wallet and valid under this wallet as the pinned root. This is NOT proof that the wallet is the independently trusted publisher of the service name.'
   };
 }
 return {
   status:'review',
   issue:decision?.issue?'Reader verification issue: '+decision.issue:'Unable to confirm this wallet can edit the current record.'
 };
}
