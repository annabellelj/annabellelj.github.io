(() => {
 const chapters=[...document.querySelectorAll('[data-chapter]')];
 const label=document.querySelector('#story-chapter'),number=document.querySelector('#story-number'),bar=document.querySelector('#chapter-progress');
 const colors={cs:'204,219,205',journalism:'234,213,204'};
 let scheduled=false;
 function update(){
  scheduled=false;const center=innerHeight*.5;
  let current=null;
  chapters.forEach(section=>{const r=section.getBoundingClientRect();if(r.top<center&&r.bottom>center)current={section,r};});
  if(current){const {section,r}=current;label.textContent=section.dataset.chapter;number.textContent=section.dataset.number+' / 02';bar.style.transform=`scaleY(${Math.max(0,Math.min(1,(center-r.top)/r.height))})`;document.body.style.setProperty('--story-tint',colors[section.id]);}
  else{label.textContent=scrollY<innerHeight*2?'Prologue':'Epilogue';number.textContent=scrollY<innerHeight*2?'00 / 02':'02 / 02';bar.style.transform='scaleY(0)';}
 }
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
})();
