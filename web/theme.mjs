// Presentation theme only. Never touches wallet state, trusted identities or records.
const storageKey='relayline:visual-theme';
const root=document.documentElement;
function current(){return root.dataset.theme==='light'?'light':'dark'}
function updateControls(){
 const light=current()==='light';
 document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
  button.setAttribute('aria-label',light?'Switch to dark mode':'Switch to light mode');
  button.setAttribute('aria-pressed',String(light));
  const label=button.querySelector('[data-theme-label]');
  if(label)label.textContent=light?'Dark':'Light';
 });
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute('content',light?'#f7f6f2':'#090909');
}
function applyTheme(value){
 root.dataset.theme=value;
 try{localStorage.setItem(storageKey,value)}catch{}
 updateControls();
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-theme-toggle]');
 if(!button)return;
 applyTheme(current()==='dark'?'light':'dark');
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateControls,{once:true});
else updateControls();
