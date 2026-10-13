import { ExpirationTime,jsonToPayload } from '@arkiv-network/sdk';
import { str,u64 } from '@arkiv-network/sdk/attr';
import { normalizeAddress } from './policy.mjs';
import { validateRevocation,validateRotation } from './control-policy.mjs';

export async function publishControl({publicClient,walletClient,account,kind,data}){
  if(!['revocation','rotation'].includes(kind))throw new Error('Unsupported control action');
  if(await publicClient.getChainId()!==7738577)throw new Error('Wrong Arkiv network');
  const creator=normalizeAddress(account);
  const signer=typeof walletClient?.account==='string' ?
    walletClient.account:walletClient?.account?.address;
  if(normalizeAddress(signer)!==creator)throw new Error('Control signer mismatch');
  const payload=kind==='revocation'?validateRevocation(data):validateRotation(data);
  const attributes={
    project:str('relayline-v1'),service_id:str(payload.service_id),kind:str(kind),
    ...(kind==='revocation'?{target_key:str(payload.target_key)}:{epoch:u64(1n)})
  };
  const receipt=await walletClient.createEntity({
    payload:jsonToPayload(payload),contentType:'application/json',
    attributes,expires:ExpirationTime.fromDays(90),
    flags:{readonly:true,permissionlessExtension:false}
  });
  return {kind,creator,entityKey:receipt.entityKey,txHash:receipt.txHash};
}
