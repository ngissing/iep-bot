/* Curriculum lookup panel.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

function search(q){
  const words = (q.toLowerCase().match(/[a-z]{3,}/g)||[]);
  if(!words.length) return [];
  return CURRICULUM.map(r=>{
    const hay=(r.d+' '+r.b+' '+r.s).toLowerCase();
    let s=0; words.forEach(w=>{ if(hay.includes(w)) s+=w.length; });
    return {r,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,10).map(x=>x.r);
}
function runSearch(){
  const hits = search($('q').value);
  $('hits').innerHTML = hits.length
    ? `<div class="fine" style="margin-bottom:6px">Click one to anchor the goal to it.</div>` +
      hits.map(r=>`<div class="hit" data-c="${r.c}" data-a="${esc(r.a)}" data-l="${esc(r.l)}" data-b="${esc(r.b)}">
        <code>${r.c}</code> · <em>${r.a} · ${r.l} · ${r.b}</em><br>${esc(r.d).slice(0,150)}</div>`).join('')
    : '<div class="fine">Nothing in the bundled list. That level probably isn\'t covered — use “code to be confirmed by teacher” rather than the nearest code you can find.</div>';
}
/* clicking a result stages the instruction in the chat box — it doesn't send.
   The teacher still gets to say WHY, and the model still has to justify the fit. */
$('hits').addEventListener('click', e=>{
  const h = e.target.closest('.hit'); if(!h) return;
  const {c,a,l,b} = h.dataset;
  $('in').value = `Anchor the goal to ${c} (${a} | ${l} | ${b}).`;
  $('in').focus();
  $('in').dispatchEvent(new Event('input'));
  document.querySelectorAll('.hit').forEach(x=>x.classList.remove('pick'));
  h.classList.add('pick');
});
$('qgo').onclick = runSearch;
$('q').addEventListener('keydown',e=>{ if(e.key==='Enter') runSearch(); });
