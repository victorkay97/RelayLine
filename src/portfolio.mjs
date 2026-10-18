import { str } from '@arkiv-network/sdk/attr';
import { eq } from '@arkiv-network/sdk/query';
import { normalizeAddress } from './policy.mjs';
import { makePublicClient } from './browser-arkiv.mjs';

/**
 * Read-only bounded discovery by immutable Arkiv $creator. Public records only.
 * No secret wallet material or RelayLine backend required.
 * Fail closed on incomplete pagination instead of showing a falsely complete list.
 */
export async function queryPublisherPortfolio(client, walletAddress, { maxEntities = 1200 } = {}) {
  const creator = normalizeAddress(walletAddress);
  if (await client.getChainId() !== 7738577) throw new Error('Expected Arkiv Tiramisu');
  if (!Number.isSafeInteger(maxEntities) || maxEntities < 1 || maxEntities > 1200) throw new Error('Invalid portfolio limit');
  let page = await client.select({
    key:true, creator:true, createdAt:true, expiresAt:true, attributes:true, payload:true
  }).where(eq('project',str('relayline-v1')), eq('kind',str('manifest')))
    .createdBy(creator).limit(200).fetch();
  const headBlock=page.blockNumber;
  if(typeof headBlock!=='bigint')throw new Error('Missing Arkiv query snapshot');
  const records=[];
  for(;;){
    if(!Array.isArray(page.entities))throw new Error('Malformed Arkiv query page');
    if(records.length+page.entities.length>maxEntities)
      throw new Error('Portfolio too large for this preview. Refusing incomplete results.');
    for(const entity of page.entities){
      let data=null;try{data=entity.toJson()}catch{}
      records.push({
        key:entity.key,creator:entity.creator,createdAt:entity.createdAt,
        expiresAt:entity.expiresAt,attributes:entity.attributes,data
      });
    }
    if(!page.hasNextPage())break;
    page=await page.next();
    if(page.blockNumber!==headBlock)throw new Error('Portfolio query changed snapshot between pages');
  }
  return {headBlock,records};
}

export function browserPublisherPortfolio(address, options){
  return queryPublisherPortfolio(makePublicClient(),address,options);
}
