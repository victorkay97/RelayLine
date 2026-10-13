import { walletClient,publicClient } from '../src/arkiv.mjs';
import { publishControl } from '../src/control-arkiv.mjs';
// One hop ONLY. The successor must publish a higher-revision manifest before
// this root signs a rotation. Readers reject conflicts and stale epochs.
if(process.env.CONTROL_PUBLISH!=='YES'){
 console.error('Refusing to sign: set CONTROL_PUBLISH=YES and review the successor wallet out of band.');process.exit(2);
}
try{
 const wallet=walletClient('PUBLISHER_PRIVATE_KEY');
 const result=await publishControl({publicClient:publicClient(),walletClient:wallet.client,
  account:wallet.address,kind:'rotation',data:{
    schema_version:1,service_id:process.env.SERVICE_ID,successor:process.env.NEW_PUBLISHER_ADDRESS,
    epoch:1,min_revision:Number(process.env.MIN_SUCCESSOR_REVISION)
  }});
 console.log(JSON.stringify({mode:'ACTUAL_ARKIV_WRITE',...result},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
