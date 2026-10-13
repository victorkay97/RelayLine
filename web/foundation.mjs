import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/inter/wght.css';
import './styles.css';
import { paintIcons } from './icons.mjs';

export { paintIcons };
export function byId(id){return document.getElementById(id)}
export function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g, char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
}
export function status(node,message,kind='neutral'){
  if(!node)return;
  node.textContent=message;
  node.dataset.kind=kind;
}
export function short(value,start=8,end=6){
  const s=String(value??'');
  return s.length>start+end?s.slice(0,start)+'…'+s.slice(-end):s;
}
export function switchBusy(button,busy,busyLabel){
  if(!button)return;
  if(busy){
    if(!button.dataset.idleLabel)button.dataset.idleLabel=button.innerHTML;
    button.disabled=true;
    if(busyLabel)button.textContent=busyLabel;
  }else{
    button.disabled=false;
    if(button.dataset.idleLabel){
      button.innerHTML=button.dataset.idleLabel;
      delete button.dataset.idleLabel;
      paintIcons();
    }
  }
}
export async function copyText(text){
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable on this connection. Copy the value manually.');
  await navigator.clipboard.writeText(String(text));
}
export function describeError(error){
  const code=error?.code??error?.cause?.code;
  if(code===4001)return 'The wallet request was cancelled. Nothing was published.';
  if(code===-32002)return 'Your wallet already has a request open. Please open the wallet and respond there.';
  const message=error?.shortMessage||error?.message||'Something went wrong.';
  if(/insufficient funds|funds for gas/i.test(message))
    return 'This test wallet needs test GLM for the network fee. Fund it using the official Arkiv faucet, then try again.';
  if(/rpc|network|fetch|timeout|gateway|503|502|429/i.test(message))
    return 'The Arkiv network could not be reached reliably. Check your connection, then retry. No recovery information has been assumed.';
  return String(message).slice(0,320);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintIcons,{once:true});
else paintIcons();
