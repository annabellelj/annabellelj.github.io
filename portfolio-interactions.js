/* Image placeholders with progressive enhancement; no 3D runtime required. */
(() => {
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const labels={hello:'Say hi to Annabelle',coding:'Run a little hello world',journalism:'Explore an interview question',creative:'Start the photo countdown',about:'A little more about Annabelle'};
 const hints={hello:'Click to say hi ↗',coding:'Run hello world ↗',journalism:'Ask a question ↗',creative:'Ready? 1, 2, 3 ↗',about:'A little more about me ↗'};
 const timers=new Set();
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
 const figures=[...document.querySelectorAll('[data-character]')];
 figures.forEach(figure=>{
  const role=figure.dataset.character,img=figure.querySelector('img');
  const button=document.createElement('button');button.type='button';button.className='character-trigger';button.setAttribute('aria-label',labels[role]);
  img.before(button);button.append(img);img.draggable=false;
  const hint=document.createElement('span');hint.className='character-hint';hint.textContent=hints[role];button.append(hint);
  const bubble=document.createElement('div');bubble.className='character-message';bubble.setAttribute('role','status');bubble.setAttribute('aria-live','polite');figure.append(bubble);
  let count=0,busy=false,hideTimer;
  function show(text,duration=4200){clearTimeout(hideTimer);timers.delete(hideTimer);bubble.textContent=text;bubble.classList.add('is-open');hideTimer=later(()=>bubble.classList.remove('is-open'),duration);}
  button.addEventListener('pointermove',e=>{if(motion.matches||!fine.matches)return;const r=button.getBoundingClientRect();button.style.setProperty('--lean',`${((e.clientX-r.left)/r.width-.5)*5}deg`);button.style.setProperty('--lift',`${((e.clientY-r.top)/r.height-.5)*-7}px`);});
  const reset=()=>{button.style.setProperty('--lean','0deg');button.style.setProperty('--lift','0px');};
  button.addEventListener('pointerleave',reset);button.addEventListener('blur',reset);motion.addEventListener('change',reset);
  button.addEventListener('click',()=>{
   if(busy)return;
   count++;
   if(role==='hello')show(['Hi, I’m Annabelle! 👋','Code, stories, and a little curiosity.','So glad you stopped by.'][ (count-1)%3 ]);
   if(role==='about')show(['One curious mind. Many interests.','CS + Journalism at Columbia.','Let’s make something thoughtful.'][ (count-1)%3 ]);
   if(role==='journalism')show(['Who does this affect?','What’s the story behind that?','What should people understand?'][ (count-1)%3 ]);
   if(role==='coding'){
    busy=true;button.setAttribute('aria-disabled','true');show('> hello_world()',3500);
    later(()=>show('> Hello, curious human.\n✓ Ready to build something.',4000),650);
    later(()=>{busy=false;button.removeAttribute('aria-disabled');},700);
   }
   if(role==='creative'){
    busy=true;button.setAttribute('aria-disabled','true');figure.classList.add('is-framing');show('1',5000);
    later(()=>show('2',5000),700);later(()=>show('3',5000),1400);
    later(()=>{show('Got it. A new perspective. ✨');figure.classList.remove('is-framing');figure.classList.add('is-captured');busy=false;button.removeAttribute('aria-disabled');later(()=>figure.classList.remove('is-captured'),1200);},2100);
   }
  });
 });
 // Reveal once, with content staying visible if JS/observers are unavailable.
 if('IntersectionObserver' in window&&!motion.matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('has-entered');observer.unobserve(e.target);}}),{threshold:.12});
  document.querySelectorAll('.chapter .editorial-copy,.chapter .character').forEach(el=>{el.classList.add('will-enter');observer.observe(el);});
  motion.addEventListener('change',()=>{if(motion.matches){document.querySelectorAll('.will-enter').forEach(el=>el.classList.add('has-entered'));observer.disconnect();}});
 }
 // Copy is an explicit action; the existing mailto remains available.
 const social=document.querySelector('.social-links');
 if(social){const copy=document.createElement('button');copy.type='button';copy.className='copy-email';copy.textContent='Copy email';social.append(copy);
  const feedback=document.createElement('span');feedback.className='copy-feedback';feedback.setAttribute('role','status');social.after(feedback);
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('alj2162@columbia.edu');feedback.textContent='Email copied.';}catch{feedback.textContent='alj2162@columbia.edu — select this address to copy.';}later(()=>feedback.textContent='',4500);});
 }
 window.addEventListener('pagehide',()=>{timers.forEach(clearTimeout);timers.clear();});
})();
