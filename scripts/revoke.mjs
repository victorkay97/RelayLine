import { walletClient,publicClient } from '../src/arkiv.mjs';
import { publishControl } from '../src/control-arkiv.mjs';
const serviceId=process.env.SERVICE_ID;
const target=process.env.REVOKE_ENTITY_KEY;
const reason=process.env.REVOKE_REASON??'retired';
if(process.env.CONTROL_PUBLISH!=='YES'){
  console.error('Refusing to sign: set CONTROL_PUBLISH=YES explicitly with a dedicated funded test wallet.');process.exit(2);
}
try{
  const wallet=walletClient('PUBLISHER_PRIVATE_KEY');
  const result=await publishControl({publicClient:publicClient(),walletClient:wallet.client,
    account:wallet.address,kind:'revocation',
    data:{schema_version:1,service_id:serviceId,target_key:target,reason}});
  console.log(JSON.stringify({mode:'ACTUAL_ARKIV_WRITE',...result},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
