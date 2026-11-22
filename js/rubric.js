/* DET Quality Checklist Rubric, indicators 2-7.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- DET Quality Checklist Rubric — indicators 2-7 ----------
   Scores what the plan text can evidence. Indicator 1 (SSG collaboration) needs real
   meeting input and is never auto-scored — it's shown as an open item, per the rubric.
   Where a signal can't be verified from text, the scorer says so rather than awarding 3. */
function scoreRubric(){
  const A = plan.areas, filled = AREAS.filter(a=>A[a].goals.length);
  if (!filled.length) return null;
  const anyGoal = filled.flatMap(a=>A[a].goals);
  const anyStrat = filled.flatMap(a=>A[a].strategies).map(s=>(s.strategies||'')).join(' ').toLowerCase();
  const assess = (plan.assess||'').toLowerCase();

  // pull strength nouns from Stage 1 to test whether they resurface in Stage 3 (indicator 3)
  const strengthText = (assess.split(/entry-level|challenges|barriers/)[0]||'');
  const strengthWords = [...new Set((strengthText.match(/[a-z]{5,}/g)||[])
    .filter(w=>!['strength','strengths','interest','interests','student','learning','really','which','their','about'].includes(w)))];
  const strengthReused = strengthWords.some(w=>{ const stem = w.replace(/(s|es|ing|ed)$/,''); return stem.length>3 && anyStrat.includes(stem); });

  const measurable = anyGoal.every(g=>{ const s=(g.success||'').toLowerCase();
    return /\d|%/.test(s) && !VAGUE.some(v=>s.includes(v)); });
  const linkedLTG = filled.every(a=>A[a].ltg && (CODE_RE.test(A[a].ltg) || /Personal Development|VPC|to be confirmed/i.test(A[a].ltg)));
  const stgAreSubskills = filled.every(a=>A[a].ltg && A[a].goals.length);
  const strategiesComplete = filled.every(a=>A[a].strategies.length && A[a].strategies.every(s=>['TEACH','PRACTISE','REINFORCE','SSG'].every(m=>(s.strategies||'').toUpperCase().includes(m+':'))));
  const evalHasEvidence = filled.every(a=>{ const e=(A[a].evaluate||'').toLowerCase();
    return e && /(exit ticket|formative|summative|assessment|observation|tally|work sample|data|able|pat)/.test(e); });
  const evalHasReview = filled.every(a=>/(week|wk|term|review|ssg)/i.test(A[a].evaluate||''));
  const barriersInsight = /barrier|challenge/.test(assess) && /(strateg|address|support|adjust|because|which means|so that)/.test(assess);
  const detailForMeasurable = /level|word|out of|\d/.test(assess) && measurable;
  const studentVoice = /student voice|what helps|i learn|helps me/.test(assess);

  const I = [
    {n:2, name:'Student assessment', score: detailForMeasurable?3:(/\d|level/.test(assess)?2:1),
     why: detailForMeasurable?'Entry skills detailed enough to drive measurable goals.':'Entry skills too thin to guarantee measurable goals — "below level" scores 1. Add the last skill mastered and first not yet.'},
    {n:3, name:'Strengths-based', score: (strengthReused && studentVoice)?3:(strengthWords.length?2:1),
     why: strengthReused?'Stage 1 strengths resurface in the strategies.':'Strengths are listed in Stage 1 but don\'t reappear in Stage 3 — the commonest way this drops to 2. Make a strategy USE a named strength.'},
    {n:4, name:'Barriers & challenges', score: barriersInsight?3:(/barrier|challenge/.test(assess)?2:1),
     why: barriersInsight?'Barriers named with suggestions to address them.':'Barriers named but without insight on addressing them — add how each is met.'},
    {n:5, name:'Goal design', score: (measurable && linkedLTG && stgAreSubskills)?3:((measurable||linkedLTG)?2:1),
     why: (measurable&&linkedLTG&&stgAreSubskills)?'SMART goals linked to curriculum, short-terms sub-skills of the long-term.':!measurable?'A success measure isn\'t a count/rate/threshold — drops to 2.':!linkedLTG?'A long-term goal lacks a curriculum/continuum link — drops to 2.':'2.'},
    {n:6, name:'Strategies & adjustments', score: (strategiesComplete && strengthReused)?3:(strategiesComplete?2:1),
     why: (strategiesComplete&&strengthReused)?'Strategies tailored to goals and using student strengths.':!strategiesComplete?'A strategy is missing one of TEACH/PRACTISE/REINFORCE/SSG.':'Strategies present but not visibly built on the student\'s strengths — drops to 2.'},
    {n:7, name:'Monitoring & evaluating', score: (evalHasReview && evalHasEvidence)?3:(evalHasReview?2:1),
     why: (evalHasReview&&evalHasEvidence)?'Review timeline plus named evidence source.':evalHasReview?'Has a review point but names no evidence source — add exit tickets, ABLES/PAT, work samples or observation.':'No review plan.'},
  ];
  return I;
}

function renderRubric(){
  const box = $('rubric'); if (!box) return;
  const I = scoreRubric();
  if (!I){ box.innerHTML = '<div class="fine">Scores once an area has goals. Indicator 1 (SSG collaboration) is completed at the meeting, not here.</div>'; return; }
  const total = I.reduce((s,i)=>s+i.score,0), max = I.length*3;
  const bar = s=>`<span class="pips">${[1,2,3].map(n=>`<i class="${n<=s?'on s'+s:''}"></i>`).join('')}</span>`;
  box.innerHTML =
    `<div class="rtotal">Indicators 2–7: <b>${total}/${max}</b> <span>· indicator 1 (SSG) completed at the meeting</span></div>` +
    I.map(i=>`<div class="rrow"><div class="rhead">${bar(i.score)} <b>#${i.n} ${i.name}</b> <span class="rs s${i.score}">${i.score}</span></div><div class="rwhy">${esc(i.why)}</div></div>`).join('');
}
