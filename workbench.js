(() => {
 const screen=document.querySelector('#project-screen');if(!screen)return;
 const tabs=[...document.querySelectorAll('[data-project]')],prev=document.querySelector('#previous-project'),next=document.querySelector('#next-project'),restore=document.querySelector('#restore-projects'),status=document.querySelector('#desktop-status');
 const original=screen.innerHTML;let current=tabs[0];
 const flows={coderecall:['Capture','Reflect','Review'],careertracker:['Apply','Match','Review'],zooxr:['Place in AR','Export','Explore VR'],fluenttext:['Write','Refine','Respond']};
 const open=()=>tabs.filter(t=>!t.parentElement.hidden);
 function select(tab,focus=false){
  current=tab;const active=open();
  tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});
  prev.disabled=next.disabled=active.length<2;
  if(!tab){screen.removeAttribute('aria-labelledby');screen.setAttribute('aria-label','No open projects');screen.innerHTML='<p class="screen-label">Desktop cleared</p><h3>All caught up.</h3><p class="screen-description">Reopen the tabs to explore another project, or browse the collection below.</p>';status.textContent='No open projects';restore.focus();return;}
  screen.innerHTML=original;screen.removeAttribute('aria-label');screen.setAttribute('aria-labelledby',tab.id);
  const entry=document.getElementById(tab.dataset.project);
  screen.querySelector('.screen-label').textContent=`0${tabs.indexOf(tab)+1} / Selected project`;
  screen.querySelector('h3').textContent=entry.querySelector('h2').textContent;
  screen.querySelector('.screen-description').textContent=entry.querySelector('.entry-description').textContent;
  screen.querySelectorAll('.system-flow span').forEach((n,i)=>n.textContent=flows[tab.dataset.project][i]);
  screen.querySelector('.technology-tags').replaceWith(entry.querySelector('.technology-tags').cloneNode(true));
  screen.querySelector('a').href='#'+tab.dataset.project;
  screen.querySelector('a').addEventListener('click',()=>document.querySelector('[data-filter="all"]').click());
  status.textContent=`${active.indexOf(tab)+1} / ${active.length} open projects`;
  if(focus)tab.focus();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){screen.getAnimations().forEach(a=>a.cancel());screen.animate([{opacity:.4,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});}
 }
 function move(delta){const list=open();if(list.length)select(list[(list.indexOf(current)+delta+list.length)%list.length],true);}
 function close(tab){const list=open(),index=list.indexOf(tab);tab.parentElement.hidden=true;const remaining=open();select(tab===current?remaining[Math.min(index,remaining.length-1)]:current,true);}
 tabs.forEach(tab=>tab.addEventListener('click',()=>select(tab)));
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close(tabs.find(t=>t.dataset.project===b.dataset.close))));
 prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 restore.addEventListener('click',()=>{tabs.forEach(t=>t.parentElement.hidden=false);select(tabs[0],true);});
 document.querySelector('.monitor-frame').addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}
  if(e.target.matches('[role="tab"]')&&e.key==='Delete'){e.preventDefault();close(e.target);}
 });
 select(current);
})();
