// Compact, accessible navigation for the shared public header.
// Desktop navigation remains always visible; small screens use an explicit menu.
function setupNavigation(){
  const toggle=document.querySelector('[data-menu-toggle]');
  const nav=document.getElementById('primary-navigation');
  const container=toggle?.closest('.nav-container');
  if(!toggle||!nav||!container)return;
  const compact=window.matchMedia('(max-width: 900px)');
  function setOpen(open){
    const next=Boolean(open&&compact.matches);
    toggle.setAttribute('aria-expanded',String(next));
    toggle.setAttribute('aria-label',next?'Close navigation menu':'Open navigation menu');
    toggle.setAttribute('title',next?'Close navigation menu':'Open navigation menu');
    container.toggleAttribute('data-nav-open',next);
  }
  toggle.addEventListener('click',()=>{
    setOpen(toggle.getAttribute('aria-expanded')!=='true');
  });
  nav.addEventListener('click',event=>{
    if(event.target.closest('a'))setOpen(false);
  });
  document.addEventListener('pointerdown',event=>{
    if(toggle.getAttribute('aria-expanded')==='true'&&!container.contains(event.target))setOpen(false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){
      setOpen(false);
      toggle.focus();
    }
  });
  compact.addEventListener('change',()=>setOpen(false));
  setOpen(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupNavigation,{once:true});
else setupNavigation();
