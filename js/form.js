/* The plan form: rendering, editing, deleting goals.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- render the form ---------- */
function esc(s){ return (s||'').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c])); }

const AREA_HINT = {
  literacy:'anchors to English (VC2E)',
  numeracy:'anchors to Mathematics (VC2M)',
  wellbeing:'anchors to P&SC (VC2CP), HPE Health strand only, or PDS for VM'
};

function areaBlock(a){
  return `<section class="areacard">
  <div class="stage areahead">${AREA_LABEL[a]} <span>${AREA_HINT[a]}</span></div>
  <div class="stage sub">Long-term goal <span>from a content description, with code</span></div>
  <textarea class="cell" data-area="${a}" data-k="ltg" style="min-height:52px" placeholder="Comes from the curriculum at the working level, rewritten as a student action."></textarea>
  <div class="stage sub">Short-term SMART goals <span>2–3, no codes — read across → one sentence</span></div>
  <table class="goals" data-area="${a}"><thead><tr>
    <th class="gnum">#</th><th style="width:30%">Action</th><th style="width:23%">Under what conditions</th><th style="width:23%">Success measure</th><th>By when</th><th class="delcol"></th>
  </tr></thead><tbody></tbody></table>
  <div class="stage sub">Teach <span>TEACH · PRACTISE · REINFORCE · SSG</span></div>
  <table class="strats" data-area="${a}"><thead><tr>
    <th class="gnum">#</th><th>Teaching strategies, adjustments and supports</th><th style="width:24%">Person/s responsible</th>
  </tr></thead><tbody></tbody></table>
  <div class="stage sub">Evaluate</div>
  <textarea class="cell" data-area="${a}" data-k="evaluate" style="min-height:52px" placeholder="Review point, evidence tracked, decision rule — for this area."></textarea>
  </section>`;
}
$('areas').innerHTML = AREAS.map(areaBlock).join('');

function render(){
  $('yl').textContent = plan.year_level || '—';
  if (document.activeElement !== $('assess')) $('assess').value = plan.assess||'';

  AREAS.forEach(a=>{
    const A = plan.areas[a];
    document.querySelectorAll(`[data-area="${a}"][data-k]`).forEach(el=>{
      if (document.activeElement !== el) el.value = A[el.dataset.k]||'';
    });
    const gb = document.querySelector(`table.goals[data-area="${a}"] tbody`);
    gb.innerHTML = A.goals.length ? A.goals.map((g,i)=>`<tr data-i="${i}">
        <td class="gnum">${esc(g.n||String(i+1))}</td>
        <td contenteditable data-k="action">${esc(g.action)}</td>
        <td contenteditable data-k="conditions">${esc(g.conditions)}</td>
        <td contenteditable data-k="success">${esc(g.success)}</td>
        <td contenteditable data-k="by_when">${esc(g.by_when)}</td>
        <td class="delcol"><button class="delg" data-area="${a}" data-i="${i}" title="Delete this short-term goal">×</button></td></tr>`).join('')
      : `<tr><td colspan="6" class="empty" style="padding:12px">Filled during the ${a} pass of the interview.</td></tr>`;
    const sb = document.querySelector(`table.strats[data-area="${a}"] tbody`);
    sb.innerHTML = A.strategies.length ? A.strategies.map((s,i)=>`<tr data-i="${i}">
        <td class="gnum">${esc(s.goal||String(i+1))}</td>
        <td contenteditable data-k="strategies">${esc(s.strategies).replace(/\n/g,'<br>')}</td>
        <td contenteditable data-k="responsible">${esc(s.responsible)}</td></tr>`).join('')
      : `<tr><td colspan="3" class="empty" style="padding:12px">Strategies appear once this area's goals are chosen.</td></tr>`;
  });
  check();
  updateLayout();
}

/* Simple start: until the first goal content arrives (normally the literacy draft), the
   page shows only the chat and start form — no plan panel, no stage bar. Once revealed,
   the plan stays visible for the rest of that plan, even if goals are later deleted.
   reset() sets planRevealed back to false. */
let planRevealed = false;
function updateLayout(){
  if (!planRevealed && AREAS.some(a=>plan.areas[a].ltg || plan.areas[a].goals.length)){
    planRevealed = true;
    if (document.body.classList.contains('intro'))
      say('Your plan is now showing on the right. It fills in as we go, and you can edit any box there directly.','note');
  }
  document.body.classList.toggle('intro', !planRevealed);
}

/* Deleting a short-term goal takes its strategies row with it and renumbers what's left,
   so the plan never carries strategies pointing at a goal that no longer exists. */
function deleteGoal(area, i){
  const A = plan.areas[area];
  if (!A.goals[i]) return;
  const gone = String(A.goals[i].n || i+1);
  A.goals.splice(i,1);
  A.strategies = A.strategies.filter(s=>String(s.goal) !== gone);
  const map = {};
  A.goals.forEach((g,idx)=>{ map[String(g.n||idx+1)] = String(idx+1); });
  A.goals.forEach((g,idx)=>{ g.n = String(idx+1); });
  A.strategies.forEach(s=>{ if (map[String(s.goal)]) s.goal = map[String(s.goal)]; });
  render();
}
$('form').addEventListener('click', e=>{
  const b = e.target.closest('.delg'); if (!b) return;
  deleteGoal(b.dataset.area, +b.dataset.i);
});

/* one delegated listener covers every editable cell and textarea in every area */
$('form').addEventListener('input', e=>{
  const el = e.target;
  if (el.id === 'assess'){ plan.assess = el.value; check(); return; }
  const area = el.dataset.area || el.closest('[data-area]')?.dataset.area;
  if (!area) return;
  if (el.tagName === 'TEXTAREA'){ plan.areas[area][el.dataset.k] = el.value; check(); return; }
  const td = el.closest?.('td[contenteditable]'); if (!td) return;
  const arr = td.closest('table').classList.contains('goals') ? 'goals' : 'strategies';
  const i = +td.closest('tr').dataset.i;
  plan.areas[area][arr][i][td.dataset.k] = td.innerText.replace(/\u00a0/g,' ').trim();
  check();
});
