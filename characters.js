/* Brings the CS and Journalism page characters to life: pointer lean, code glyphs, mic bursts. */
(() => {
 const figure=document.querySelector('.page-figure');if(!figure)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fx=figure.querySelector('.figure-fx'),role=figure.dataset.role;
 const glyphs=['</>','{ }','=>','( )',';','[ ]','fn','&&','git push'];
 function glyph(){
  if(reduced.matches||document.hidden)return;
  const g=document.createElement('span');g.className='code-glyph';
  g.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
  g.style.setProperty('--dx',`${Math.round(Math.random()*50-25)}px`);
  g.addEventListener('animationend',()=>g.remove(),{once:true});fx.append(g);
 }
 if(role==='cs'){const id=setInterval(glyph,1100);addEventListener('pagehide',()=>clearInterval(id),{once:true});}
 addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType!=='mouse')return;
  const r=figure.getBoundingClientRect(),x=(e.clientX-(r.left+r.width/2))/innerWidth,y=(e.clientY-(r.top+r.height/2))/innerHeight;
  figure.style.setProperty('--lean-x',`${Math.max(-1,Math.min(1,x))*10}deg`);
  figure.style.setProperty('--lean-y',`${Math.max(-1,Math.min(1,y))*-6}deg`);
 },{passive:true});
 document.addEventListener('pointerleave',()=>{figure.style.setProperty('--lean-x','0deg');figure.style.setProperty('--lean-y','0deg');});
 figure.addEventListener('click',()=>{
  if(reduced.matches)return;
  if(role==='cs'){for(let i=0;i<5;i++)setTimeout(glyph,i*90);}
  else{figure.classList.remove('is-burst');void figure.offsetWidth;figure.classList.add('is-burst');setTimeout(()=>figure.classList.remove('is-burst'),2000);}
 });
})();
