/* Plan checks: the JS port of validate_plan.py.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- checks: the JS port of validate_plan.py ---------- */
const VAGUE = ['will improve','show progress','make progress','engage more','do better','as appropriate','where possible','when able','more often','consistently','successfully','satisfactorily','to a high standard'];
const DEFICIT = ['will stop','will not ','will cease','will refrain','will avoid','will no longer','will reduce their'];
/* The failure mode is a goal that sets out to fix the condition ("will manage their ADHD"),
   not any mention of it — "will use a coping strategy when anxious" is a perfectly good
   skill goal. Matching bare acronyms was worse than useless: ADD flagged "will add
   fractions" and ODD flagged "will identify odd numbers", both ordinary numeracy goals. */
const CONDITION = 'dyslexi\\w*|dyscalculi\\w*|dysgraphi\\w*|dyspraxi\\w*|ADHD|autism|autistic|ASD|asperger\\w*|FASD|tourette\\w*|anxiety|depression|intellectual disability|language disorder|DLD|auditory processing|selective mutism|OCD|PTSD|their diagnosis|their condition|their disability';
const DIAGNOSIS_GOAL = new RegExp(`\\b(manage|overcome|reduce|control|improve|address|fix|treat|cure|minimis\\w*|combat)\\b[^.]{0,24}\\b(${CONDITION})\\b`, 'i');
const CODE_RE = /\bVC2[A-Z0-9]{4,9}\b/g;

function check(){
  const E=[], W=[], P=[];
  const all = JSON.stringify(plan);

  (all.match(CODE_RE)||[]).forEach(c=>{
    if(!CODES.has(c) && !E.some(x=>x.includes(c)))
      E.push(`${c} is not in the bundled curriculum. Either it doesn't exist or this list doesn't cover that level — write "code to be confirmed by teacher" instead of shipping it.`);
  });
  if (VSN.test(all))    E.push('A 9-digit number that looks like a VSN is in the plan. Remove it before building.');
  if (DOB.test(all))    E.push('A date of birth is in the plan. Remove it before building.');
  if (SCHOOL.test(all)) E.push('A school name is in the plan. Remove it before building.');

  const FAMILY = {literacy:/VC2E/, numeracy:/VC2M/, wellbeing:/VC2CP|VC2HP\d+P/};
  AREAS.forEach(a=>{
    const A = plan.areas[a], name = AREA_LABEL[a];
    if (!A.goals.length && !A.ltg){ P.push(`${name}: pending — filled during its interview pass.`); return; }

    if (!A.ltg) W.push(`${name}: goals with no long-term goal to be sub-skills of.`);
    else {
      const isPDS = /Personal Development Skills/i.test(A.ltg);
      const isVPC = /\bVPC\b/i.test(A.ltg);
      if (!CODE_RE.test(A.ltg) && !/to be confirmed/i.test(A.ltg) && !isPDS && !isVPC)
        W.push(`${name}: long-term goal cites no curriculum code — the template asks for one ("comes from the Curriculum with code").`);
      else if (isVPC && !/Unit\s*\d+\s*Module\s*\d+/i.test(A.ltg))
        W.push(`${name}: VPC citation needs a Unit and Module (e.g. "Unit 1 Module 2").`);
      else if (a==='wellbeing' && isPDS && !isVPC && !/Unit\s*\d+\s*Outcome\s*\d+/i.test(A.ltg))
        W.push(`${name}: PDS citation needs a Unit and Outcome (e.g. "Unit 1 Outcome 2").`);
      else if (CODE_RE.test(A.ltg) && !FAMILY[a].test(A.ltg))
        W.push(`${name}: anchored to a code from the wrong learning area for this part of the plan.`);
    }
    if (a==='wellbeing' && /VC2HP\d+M/.test(A.ltg + JSON.stringify(A.goals)))
      E.push('Wellbeing is anchored to an HPE Movement code. School policy: Health strand only (VC2HP..P..), P&SC, or PDS.');

    /* No warning for having fewer than were drafted — deleting spares is the workflow. */
    if (A.goals.length>3) E.push(`${name}: ${A.goals.length} short-term goals. The template holds 3 — merge or cut.`);

    A.goals.forEach((g,i)=>{
      const n=g.n||(i+1);
      ['action','conditions','success','by_when'].forEach(k=>{ if(!(g[k]||'').trim()) W.push(`${name} goal ${n}: ${k.replace('_',' ')} is empty — the four components must read as one sentence.`); });
      const s=(g.success||'').toLowerCase();
      if (VAGUE.some(v=>s.includes(v)) || (s && !/\d/.test(s) && !/%/.test(s)))
        W.push(`${name} goal ${n}: "${g.success}" isn't a count, rate or threshold. What number would settle the argument at review?`);
      if (DEFICIT.some(d=>(g.action||'').toLowerCase().includes(d)))
        W.push(`${name} goal ${n}: framed as the absence of a behaviour. Name the replacement skill instead.`);
      if (/full (teacher|adult) support/i.test(g.conditions||''))
        W.push(`${name} goal ${n}: the condition swallows the goal — name a specific, fadeable adjustment.`);
      if (DIAGNOSIS_GOAL.test(g.action||''))
        W.push(`${name} goal ${n}: this goal sets out to fix a diagnosis rather than build a skill. Name the observable skill instead — the diagnosis belongs in Stage 1 barriers and shapes the Stage 3 adjustments.`);
      if (!A.strategies.some(s=>String(s.goal)===String(n)))
        W.push(`${name} goal ${n} has no strategies row.`);
    });

    A.strategies.forEach(s=>{
      ['TEACH','PRACTISE','REINFORCE','SSG'].forEach(m=>{
        if(!(s.strategies||'').toUpperCase().includes(m+':'))
          W.push(`${name} goal ${s.goal} strategies: no ${m} move. All four are required.`);
      });
      const st=(s.strategies||'').toLowerCase();
      if (/\bfad(e|ed|ing)\b/.test(st) && !/(visual|verbal|gestural|model|physical|independent)/.test(st))
        W.push(`${name} goal ${s.goal}: a fade is promised but no prompt levels are named (physical → model → gestural → direct verbal → indirect verbal → visual → independent).`);
      if(!A.goals.some(g=>String(g.n)===String(s.goal))) W.push(`${name}: strategies for goal ${s.goal}, which doesn't exist.`);
    });
    if (A.goals.length && !A.evaluate) W.push(`${name}: no evaluate section — each area has its own Stage 4 in this template.`);
  });

  /* Sensitive attributes were once fabricated from the anchor question's own option list.
     The prompt now forbids it, but this is the backstop: surface them so the teacher
     confirms each one rather than skim-reading past a plausible invention. */
  const SENSITIVE = [
    [/\b(koorie|aboriginal|torres strait|first nations|indigenous)\b/i, 'Aboriginal or Torres Strait Islander / Koorie identity'],
    [/\b(oohc|out.of.home care|foster care|kinship care|residential care)\b/i, 'out-of-home care status'],
    [/\byouth justice\b/i, 'youth justice involvement'],
    [/\b(psd|disability inclusion|dis inclusion)\b/i, 'PSD / Disability Inclusion funding'],
    [/\b(refugee|asylum seeker|eal\b|newly arrived)\b/i, 'refugee / EAL background'],
  ];
  SENSITIVE.forEach(([re,label])=>{
    if (re.test(plan.assess||''))
      W.push(`Stage 1 records ${label}. Confirm you stated this — it carries legal, cultural and funding consequences and must never be assumed. Delete it if it isn't right.`);
  });

  const who = AREAS.flatMap(a=>plan.areas[a].strategies).map(s=>s.responsible||'').join(' ').toLowerCase();
  if (who && !/parent|carer|aide|wellbeing|mentor|worker|officer|allied|student|provider|coordinator|psycholog/.test(who))
    W.push('Every action in every area belongs to a teacher. Rubric indicator 1 caps at 2 unless another SSG member owns something.');
  if (plan.assess && !/student voice|what helps|to be gathered/i.test(plan.assess))
    W.push('No student voice in Stage 1. Rubric indicator 1 caps at 2 without the student\'s own words, and it can\'t be back-filled after the SSG — ask them before the meeting.');

  const done = a=>plan.areas[a].goals.length>=1 && plan.areas[a].goals.length<=3 && plan.areas[a].ltg;
  const complete = AREAS.every(done);
  const started = AREAS.filter(a=>plan.areas[a].goals.length || plan.areas[a].ltg);
  const missing = AREAS.filter(a=>!done(a));
  const box = $('checks');
  box.innerHTML =
    E.map(t=>`<div class="v err"><b>ERROR</b><span>${esc(t)}</span></div>`).join('') +
    W.map(t=>`<div class="v warn"><b>CHECK</b><span>${esc(t)}</span></div>`).join('') +
    P.map(t=>`<div class="v ok"><b>—</b><span>${esc(t)}</span></div>`).join('') +
    (!E.length && !W.length && !P.length ? `<div class="v ok"><b>PASS</b><span>Nothing blocking. Errors are fatal; checks are judgement calls — fix them or be able to say why you didn't.</span></div>` : '');
  $('build').disabled = !!E.length || !started.length;
  $('build').textContent = E.length ? 'Fix the errors first'
    : complete ? 'Fill the DET template'
    : started.length ? `Fill the DET template — partial (${missing.map(a=>AREA_LABEL[a].replace(' Goal','')).join(', ')} outstanding)`
    : 'Nothing to build yet';
  renderRubric();
  /* Returns whether it is SAFE to build, not whether the plan is finished. Errors block;
     an incomplete plan is a legitimate partial handover and must still be downloadable. */
  return !E.length;
}
