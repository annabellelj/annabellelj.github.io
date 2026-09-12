(() => {
 const filters=[...document.querySelectorAll('[data-filter]')],entries=[...document.querySelectorAll('[data-kind]')],count=document.querySelector('#result-count');
 filters.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{const kind=button.dataset.filter;document.querySelector('.engineering-grid').classList.toggle('experience-timeline',kind==='experience');filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let total=0;entries.forEach(entry=>{entry.hidden=kind!=='all'&&entry.dataset.kind!==kind;if(!entry.hidden)total++;});count.textContent=`${total} ${total===1?'entry':'entries'}`;});});
 const tabs=[...document.querySelectorAll('[data-page]')],sheets=[...document.querySelectorAll('[data-sheet]')],book=document.querySelector('#notebook'),previous=document.querySelector('#previous-page'),next=document.querySelector('#next-page'),status=document.querySelector('#page-status');
 if(!book)return;
 let current=0,timer;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function select(index){if(index<0||index>=sheets.length)return;const changed=current!==index;current=index;tabs.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===index)));sheets.forEach((sheet,i)=>sheet.hidden=i!==index);previous.disabled=index===0;next.disabled=index===sheets.length-1;status.textContent=`Page ${index+1} of ${sheets.length} · ${['Reporting','Immersive','Research','Story'][index]}`;
 if(changed&&!reduced.matches){clearTimeout(timer);book.classList.remove('turning');void book.offsetWidth;book.classList.add('turning');timer=setTimeout(()=>book.classList.remove('turning'),650);}}
 tabs.forEach((tab,i)=>{tab.disabled=false;tab.addEventListener('click',()=>select(i));});previous.addEventListener('click',()=>select(current-1));next.addEventListener('click',()=>select(current+1));
 document.querySelector('.notebook-section').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();select(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();select(current-1);}});
 select(0);addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
})();
