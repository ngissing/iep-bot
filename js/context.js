/* What the AI is told about the curriculum and the school adjustments menu.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

function pdsContext(){
  return 'PERSONAL DEVELOPMENT SKILLS (VCE VM) — for Wellbeing goals for VCE VM students.\n' +
    'Not levelled, no VC2 codes. Cite as "Personal Development Skills (VCE VM), Unit X Outcome Y".\n' +
    PDS.units.map(u=>`${u.unit.split(':')[0]} ${u.outcome} (${u.aos.replace('Area of Study','AoS')}): ${u.statement.replace(/^On completion of this unit the student should be able to /,'')}`).join('\n');
}
function vpcContext(){
  const subj = (name, rows) => name.toUpperCase() + ':\n' +
    rows.map(g=>`  ${g.label}: ${g.statement}`).join('\n');
  return 'VPC (Victorian Pathways Certificate) — for a VPC student, ALL THREE areas anchor to VPC, not the Victorian Curriculum.\n' +
    'No VC2 codes. Cite as "VPC [Subject], [label]" exactly as shown. Literacy→VPC Literacy, Numeracy→VPC Numeracy, Wellbeing→VPC Personal Development Skills.\n\n' +
    Object.entries(VPC.subjects).map(([n,r])=>subj('VPC '+n, r)).join('\n\n');
}
function adjustmentsContext(){
  const b = ADJUSTMENTS;
  const menu = Object.entries(b.school_menu).map(([k,v]) =>
    k.replace(/_/g,' ').toUpperCase() + ': ' + v.join(' | ')).join('\n');
  const mtss = Object.entries(b.mtss).map(([dom,tiers]) =>
    dom + '\n' + Object.entries(tiers).map(([t,v]) =>
      '  ' + t.replace('t1_universal','Tier 1').replace('t2_targeted','Tier 2').replace('t3_individual','Tier 3') + ': ' + v.join(' | ')).join('\n')).join('\n');
  return 'SCHOOL ADJUSTMENTS MENU (student first-person voice):\n' + menu +
         '\n\nMTSS TIERED SUPPORTS:\n' + mtss +
         '\n\nPROMPT HIERARCHY (least→most invasive):\n' + b.prompt_hierarchy.join('\n');
}
const CODES = new Set(CURRICULUM.map(r=>r.c));
const COVER = {};
CURRICULUM.forEach(r=>{ (COVER[r.a] = COVER[r.a]||new Set()).add(r.l); });

/* Codes the model may cite. Keyword scoring alone is not enough: a teacher writes
   "Year 8, below level in numeracy", which shares no words with "expanded notation using
   powers of 10". That returned almost no Maths and the model then truthfully reported it
   had no Level 7 codes — while 31 sat unused in the bank. So: any level named in the
   conversation pulls in ALL of its codes, keyword hits top it up, and a coverage summary
   always travels so the model can never invent a gap that doesn't exist. */
const POOL = CURRICULUM.filter(r=>!/^VC2HP\d+M/.test(r.c));   // HPE Movement excluded by school policy

function coverageSummary(){
  const by = {};
  POOL.forEach(r=>{ (by[r.a] = by[r.a] || new Set()).add(r.l); });
  const rank = l => { if (l === 'Foundation') return 0; const m = l.match(/\d+/); return m ? +m[0] : 99; };
  return 'CURRICULUM COVERAGE IN THIS BANK (authoritative — do not claim a level is missing unless it is absent here):\n' +
    Object.entries(by).map(([a,s])=>{
      const ls=[...s].sort((x,y)=>rank(x)-rank(y));
      const nums=ls.filter(l=>/^Level \d+$/.test(l)).map(l=>+l.split(' ')[1]);
      let span='';
      if (nums.length){
        const runs=[]; let st=nums[0], pv=nums[0];
        nums.slice(1).forEach(n=>{ if(n===pv+1){pv=n;} else {runs.push([st,pv]); st=pv=n;} });
        runs.push([st,pv]);
        span = 'Levels ' + runs.map(([x,y])=>x===y?x:`${x}-${y}`).join(', ');
      }
      const bands = ls.filter(l=>/^Levels /.test(l));
      const extra = ls.filter(l=>!/^Level(s)? \d/.test(l));
      return `  ${a}: ${[extra.includes('Foundation')?'Foundation':null, span, bands.join(', ')].filter(Boolean).join('; ')}`;
    }).join('\n') +
    '\n  Absent entirely: Science, Humanities, The Arts, Technologies, Languages — for these write "code to be confirmed by teacher".';
}

/* Which learning areas can anchor which part of the plan. */
const AREA_SOURCE = {
  literacy:  ['English'],
  numeracy:  ['Mathematics'],
  wellbeing: ['Personal and Social Capability','Health and Physical Education'],
};
/* Sending every named level across all three areas cost ~12k tokens a message. The
   interview only ever works one area at a time, so send that area's codes.
   Two wrinkles this has to survive:
     - phase LAGS by a turn (the model reports its phase inside the reply we're about to
       request), so we include the next area too, or the first message of each pass
       arrives with no codes;
     - teachers jump around, so a clear area signal in the latest message wins. */
function areasInPlay(recentText){
  const t = (recentText||'').toLowerCase();
  const sig = {
    literacy:  (t.match(/literac|read|writ|text|spell|comprehen|english|vocab|sentence|paragraph|phonic/g)||[]).length,
    numeracy:  (t.match(/numerac|math|number|fraction|decimal|multipl|additio|subtract|measure|geometr|algebra|money/g)||[]).length,
    wellbeing: (t.match(/wellbeing|social|emotion|behaviour|behavior|regulat|help.seek|peer|friend|coping|relationship|resilien/g)||[]).length,
  };
  const [first, second] = Object.entries(sig).sort((a,b)=>b[1]-a[1]);
  // A clear, unambiguous signal is trusted on its own — no lookahead needed, which is
  // what keeps the mid-interview turns cheap.
  if (first[1] >= 2 && first[1] >= second[1]*2) return new Set([first[0]]);
  // Otherwise fall back to the phase, plus the next area, because phase lags by one turn.
  const idx = Math.min(Math.max(phase-1,0),2);
  const wanted = new Set([AREAS[idx]]);
  if (phase === 0) wanted.add('literacy'); else if (idx < 2) wanted.add(AREAS[idx+1]);
  if (first[1] > 0) wanted.add(first[0]);
  return wanted;
}

function codeContext(text, recentText){
  const stop = new Set(['the','and','for','with','that','this','their','they','will','are','can','not','from','about','what','when','have','has','a','an','of','in','on','to','is','it','be','at','my','me','i']);
  const words = (text.toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!stop.has(w));

  const areas = areasInPlay(recentText);
  const sources = new Set([...areas].flatMap(a=>AREA_SOURCE[a]));
  const SCOPED = POOL.filter(r=>sources.has(r.a));

  // 1. every level named in the conversation brings its whole level with it.
  //    Maths/English are single levels ("Level 6"); P&SC and HPE are bands
  //    ("Levels 5 and 6"), so a numeric level must pull its band in too.
  const named = new Set();
  const t = text.toLowerCase();
  const BAND = {3:'Levels 3 and 4',4:'Levels 3 and 4',5:'Levels 5 and 6',6:'Levels 5 and 6',
                7:'Levels 7 and 8',8:'Levels 7 and 8',9:'Levels 9 and 10',10:'Levels 9 and 10'};
  (t.match(/level\s*(\d{1,2})/g)||[]).forEach(m=>{
    const n = +m.match(/\d{1,2}/)[0];
    named.add('Level ' + n);
    if (BAND[n]) named.add(BAND[n]);
  });
  if (/\bfoundation\b/.test(t)) named.add('Foundation');
  const byLevel = named.size ? SCOPED.filter(r=>named.has(r.l)) : [];

  // 2. keyword hits top it up, within the same scope
  const scored = SCOPED.map(r=>{
    const hay = (r.d+' '+r.b+' '+r.s).toLowerCase();
    let s = 0; words.forEach(w=>{ if(hay.includes(w)) s += w.length; });
    return {r,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,25).map(x=>x.r);

  // 3. P&SC in full only when Wellbeing is in play — it's that area's fallback anchor
  const psc = areas.has('wellbeing') ? POOL.filter(r=>r.a==='Personal and Social Capability') : [];

  const seen = new Set(), rows = [];
  [...byLevel, ...scored, ...psc].forEach(r=>{ if(!seen.has(r.c) && rows.length<120){ seen.add(r.c); rows.push(r); } });
  return coverageSummary() +
    `\n\nCODES SUPPLIED BELOW COVER: ${[...areas].join(', ')}. If you need a code for another part of the plan, say so and it will be supplied next turn.\n\n` +
    rows.map(r=>`${r.c} | ${r.a} | ${r.l} | ${r.b} | ${r.d}`).join('\n');
}
