/* Filter pills on the CS and Journalism pages: show one section, or all of them. */
(() => {
 const buttons=[...document.querySelectorAll('.page-filter [data-filter]')];if(!buttons.length)return;
 const sections=[...document.querySelectorAll('.page-section')];
 function select(kind){
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===kind)));
  sections.forEach(s=>s.hidden=kind!=='all'&&s.id!==kind);
 }
 buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.filter)));
 // Links like journalism.html#research-notes must land on a visible section.
 addEventListener('hashchange',()=>{const t=document.querySelector(location.hash);if(t&&t.closest('[hidden]'))select('all');});
})();
