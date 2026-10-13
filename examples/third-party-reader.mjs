/**
 * Independent third-party example: no RelayLine server or signing wallet.
 * Example:
 * PINNED_PUBLISHER=0x... SERVICE_ID=some-id node examples/third-party-reader.mjs
 */
import { publicClient } from '../src/arkiv.mjs';
import { readAuthorizedService } from '../src/reader-sdk.mjs';
if(!process.env.PINNED_PUBLISHER||!process.env.SERVICE_ID){
  console.error('Set SERVICE_ID and an independently authenticated PINNED_PUBLISHER wallet');
  process.exit(2);
}
try{
  const result=await readAuthorizedService({
    client:publicClient(),serviceId:process.env.SERVICE_ID,
    pinnedPublisher:process.env.PINNED_PUBLISHER
  });
  console.log(JSON.stringify({
    chainId:7738577,atBlock:result.headBlock.toString(),
    issue:result.decision.issue,
    creator:result.decision.activeSigner,
    entityKey:result.decision.selected?.key??null,
    endpoints:result.decision.selected?.manifest.endpoints??[],
    remark:'URLs are publisher-authorized; reachability not automatically proven'
  },null,2));
  if(!result.decision.selected)process.exitCode=1;
}catch(error){console.error(error.message);process.exitCode=1;}
