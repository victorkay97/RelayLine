import {fallback,http} from 'viem';

export const DEFAULT_TIRAMISU_RPC =
  'https://rpc.tiramisu.db-chain.testnet.arkiv.network';

/** Operators explicitly configure extra independent Tiramisu RPC URLs.
 * No invented fallback endpoints; with one URL, no failover is claimed.
 * Never accept URLs carrying browser-exposed credentials or query tokens.
 */
export function parseReadRpcUrls(input=DEFAULT_TIRAMISU_RPC){
  const values=Array.isArray(input)?input:String(input).split(',');
  if(values.length<1||values.length>4)throw new Error('Configure 1–4 Arkiv RPC URLs');
  const urls=[];
  for(const raw of values){
    if(typeof raw!=='string'||!raw.trim())throw new Error('Empty Arkiv RPC URL');
    const url=new URL(raw.trim());
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash){
      throw new Error('RPC endpoints must use HTTPS without URL credentials or query tokens');
    }
    if(['localhost','127.0.0.1','[::1]'].includes(url.hostname) ||
      url.hostname.endsWith('.local'))throw new Error('Loopback/private RPC disallowed');
    if(!urls.includes(url.href))urls.push(url.href);
  }
  return urls;
}

export function makeReadTransport(input){
  const urls=parseReadRpcUrls(input);
  if(urls.length===1)return http(urls[0]);
  return fallback(urls.map(url=>http(url)),{rank:false});
}
