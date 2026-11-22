/* Filling and re-importing the DET template.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- fill the real DET template ---------- */
const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const el=(doc,n)=>doc.createElementNS(W_NS,'w:'+n);
const kids=(node,n)=>[...node.childNodes].filter(c=>c.nodeType===1&&c.localName===n);

function makePara(doc, text, opts={}, protoPPr){
  const p = el(doc,'p');
  if (protoPPr) p.appendChild(protoPPr.cloneNode(true));
  const r = el(doc,'r'), rPr = el(doc,'rPr');
  if (opts.bold) rPr.appendChild(el(doc,'b'));
  if (opts.italic) rPr.appendChild(el(doc,'i'));
  if (opts.size){ const sz=el(doc,'sz'); sz.setAttributeNS(W_NS,'w:val',String(opts.size*2)); rPr.appendChild(sz); }
  if (opts.color){ const c=el(doc,'color'); c.setAttributeNS(W_NS,'w:val',opts.color); rPr.appendChild(c); }
  if (rPr.childNodes.length) r.appendChild(rPr);
  const t = el(doc,'t');
  t.setAttribute('xml:space','preserve');
  t.textContent = text;
  r.appendChild(t); p.appendChild(r);
  return p;
}
function setCell(doc, tc, text, opts={}){
  const ps = kids(tc,'p');
  const protoPPr = ps.length ? kids(ps[0],'pPr')[0] : null;
  const keepPPr = protoPPr ? protoPPr.cloneNode(true) : null;
  ps.forEach(p=>tc.removeChild(p));
  String(text).split('\n').forEach(line=>tc.appendChild(makePara(doc,line,opts,keepPPr)));
  return tc;
}
function appendPara(doc, tc, text){
  const ps = kids(tc,'p');
  const proto = ps.length ? kids(ps[0],'pPr')[0] : null;
  tc.appendChild(makePara(doc,text,{italic:true,size:8,color:'595959'}, proto));
}
function ensureRows(tbl, needed, headerRows=1){
  let trs = kids(tbl,'tr');
  while (trs.length - headerRows < needed){
    const last = trs[trs.length-1];
    const clone = last.cloneNode(true);
    tbl.insertBefore(clone, last.nextSibling);
    trs = kids(tbl,'tr');
  }
  while (trs.length - headerRows > needed){
    tbl.removeChild(trs[trs.length-1]);
    trs = kids(tbl,'tr');
  }
  return kids(tbl,'tr');
}

/* The model writes [Student] — that's the privacy convention and it stays in the app.
   The DOCUMENT reads better as "the student", capitalised only where a sentence starts. */
function naturalise(s){
  return String(s)
    .replace(/\[Student\]/g, 'the student')
    .replace(/(^\s*|[.!?]\s+)(the student)\b/gm, (m,pre)=>pre+'The student');
}
function personify(v){
  if (typeof v === 'string') return naturalise(v);
  if (Array.isArray(v)) return v.map(personify);
  if (v && typeof v === 'object'){ const o={}; for(const k in v) o[k]=personify(v[k]); return o; }
  return v;
}

/* ---------- reading a part-completed template back in ----------
   The exact reverse of fill(): same 14-table map, same "Goal N:" stacking. Anything the
   previous person left blank comes back blank, so the interview picks up where they stopped. */
function cellText(tc){
  return kids(tc,'p').map(p=>{
    let s='';
    (function walk(n){ for (const c of n.childNodes){
      if (c.nodeType!==1) continue;
      if (c.localName==='t') s += c.textContent; else walk(c);
    }})(p);
    return s;
  }).join('\n').trim();
}
/* "Goal 1: x\nGoal 2: y" -> {1:'x', 2:'y'}; an unprefixed cell is treated as goal 1 */
function parseStack(text){
  if (!text) return {};
  const out = {}; let cur = null;
  text.split('\n').forEach(line=>{
    const m = line.match(/^Goal\s+(\d+):\s*/);
    if (m){ cur = m[1]; out[cur] = line.slice(m[0].length); }
    else if (cur !== null){ out[cur] += '\n' + line; }
    else { cur = '1'; out['1'] = line; }
  });
  return out;
}
async function importPlan(file){
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const f = zip.file('word/document.xml');
  if (!f) throw new Error('that file isn\'t a Word document');
  const doc = new DOMParser().parseFromString(await f.async('string'),'application/xml');
  const body = doc.getElementsByTagNameNS(W_NS,'body')[0];
  const tables = kids(body,'tbl');
  if (tables.length < 14) throw new Error(`this doesn't look like the three-area IEP template (${tables.length} tables, expected 14)`);

  const p = blankPlan();
  kids(tables[0],'tr').forEach(tr=>{
    const tcs = kids(tr,'tc');
    if (tcs.length>=2 && /year level/i.test(cellText(tcs[0]))) p.year_level = cellText(tcs[1]);
  });
  p.assess = cellText(kids(kids(tables[1],'tr')[0],'tc')[0]);

  const BASE = {literacy:2, numeracy:6, wellbeing:10};
  AREAS.forEach(a=>{
    const t0 = BASE[a], A = p.areas[a];
    const ltg = cellText(kids(kids(tables[t0],'tr')[0],'tc')[0]);
    A.ltg = /^TO BE COMPLETED/i.test(ltg) ? '' : ltg;

    const rows = kids(tables[t0+1],'tr');
    const parts = {};
    [['action',0],['conditions',1],['success',2],['by_when',3]].forEach(([k,ri])=>{
      const tcs = kids(rows[ri],'tc');
      parts[k] = parseStack(cellText(tcs[tcs.length-1]));
    });
    const nums = [...new Set(Object.values(parts).flatMap(o=>Object.keys(o)))].sort((x,y)=>+x-+y);
    nums.forEach(n=>{
      const g = {n, action:parts.action[n]||'', conditions:parts.conditions[n]||'',
                 success:parts.success[n]||'', by_when:parts.by_when[n]||''};
      if (g.action || g.conditions || g.success || g.by_when) A.goals.push(g);
    });

    kids(tables[t0+2],'tr').slice(1).forEach(tr=>{
      const tcs = kids(tr,'tc');
      if (tcs.length < 3) return;
      const goal = cellText(tcs[0]), strategies = cellText(tcs[1]), responsible = cellText(tcs[2]);
      if (goal || strategies || responsible)
        A.strategies.push({goal: goal || String(A.strategies.length+1), strategies, responsible});
    });

    const ev = cellText(kids(kids(tables[t0+3],'tr')[0],'tc')[0]);
    A.evaluate = /^TO BE COMPLETED/i.test(ev) ? '' : ev;
  });
  return p;
}

const BANNER = 'DRAFT — for SSG discussion and agreement. Goals in this plan are proposed only. Under DET policy an IEP must be developed in consultation with the student (where appropriate) and their parent/carer/guardian, and goals must be AGREED by the Student Support Group before the plan is enacted. Identifying details have been left blank to be completed by the teacher.';

/* The blank DET template lives at template/iep-template.docx. To update it, replace that
   file with the new official three-area template (it must keep the same 14-table layout).
   Fetched once, the first time a plan is built, then reused for every student. */
const TEMPLATE_URL = 'template/iep-template.docx';
let templateBuf = null;
async function getTemplate(){
  if (templateBuf) return templateBuf;
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`the DET template couldn't be loaded (${res.status})`);
  templateBuf = await res.arrayBuffer();
  return templateBuf;
}

async function fill(plan){
  const zip = await JSZip.loadAsync(await getTemplate());
  const xml = await zip.file('word/document.xml').async('string');
  const doc = new DOMParser().parseFromString(xml,'application/xml');
  const body = doc.getElementsByTagNameNS(W_NS,'body')[0];
  const tables = kids(body,'tbl');
  if (tables.length < 14) throw new Error(`that template has ${tables.length} tables, not the 14 the three-area template has`);

  const firstP = kids(body,'p')[0];
  const outstanding = AREAS.filter(a=>!plan.areas[a].ltg && !plan.areas[a].goals.length);
  const banner = outstanding.length
    ? BANNER + ' PARTIAL DRAFT — still to be completed: ' +
      outstanding.map(a=>AREA_LABEL[a].replace(' Goal','')).join(', ') +
      '. This file can be reopened in the goal builder to finish the remaining areas.'
    : BANNER;
  body.insertBefore(makePara(doc, banner, {bold:true,size:9,color:'C00000'}), firstP.nextSibling);

  kids(tables[0],'tr').forEach(tr=>{
    const tcs = kids(tr,'tc');
    if (tcs.length>=2 && /year level/i.test(tcs[0].textContent) && plan.year_level)
      setCell(doc, tcs[1], plan.year_level);
  });
  if (plan.assess) setCell(doc, kids(kids(tables[1],'tr')[0],'tc')[0], plan.assess);

  /* per area: [ltg 1x1, smart 4x2 transposed, strategies 4x3, evaluate 1x1] */
  const BASE = {literacy:2, numeracy:6, wellbeing:10};
  AREAS.forEach(a=>{
    const A = plan.areas[a], t0 = BASE[a];
    if (A.ltg) setCell(doc, kids(kids(tables[t0],'tr')[0],'tc')[0], A.ltg);
    else if (!A.goals.length)
      setCell(doc, kids(kids(tables[t0],'tr')[0],'tc')[0],
        'TO BE COMPLETED — this area has not been drafted yet.', {bold:true, color:'C00000'});

    /* transposed SMART table: one row per component, goals stacked in the answer cell */
    /* one goal reads cleaner without a "Goal 1:" prefix; parseStack handles both on re-import */
    const stack = k => A.goals.length===1
      ? (A.goals[0][k]||'')
      : A.goals.map((g,i)=>`Goal ${g.n||i+1}: ${g[k]||''}`).join('\n');
    const rows = kids(tables[t0+1],'tr');
    [['action',0],['conditions',1],['success',2],['by_when',3]].forEach(([k,ri])=>{
      const tcs = kids(rows[ri],'tc');
      if (A.goals.length) setCell(doc, tcs[tcs.length-1], stack(k));
    });

    const srows = ensureRows(tables[t0+2], Math.max(A.strategies.length,1));
    A.strategies.forEach((s,i)=>{
      const tcs = kids(srows[i+1],'tc');
      setCell(doc,tcs[0], String(s.goal||i+1), {bold:true});
      setCell(doc,tcs[1], s.strategies||'');
      setCell(doc,tcs[2], s.responsible||'');
    });

    if (A.evaluate) setCell(doc, kids(kids(tables[t0+3],'tr')[0],'tc')[0], A.evaluate);
  });

  zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
  return zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

let lastURL = null;
$('build').onclick = async ()=>{
  if (!check()) return;
  if (!AREAS.some(a=>plan.areas[a].goals.length || plan.areas[a].ltg)){
    say('There\'s nothing to build yet — at least one area needs a long-term goal or a short-term goal.','sys');
    return;
  }
  $('build').disabled = true; $('build').textContent='Filling…';
  try{
    const blob = await fill(personify(plan));
    if (lastURL) URL.revokeObjectURL(lastURL);
    lastURL = URL.createObjectURL(blob);
    const kb = Math.round(blob.size/1024);
    $('dl').innerHTML =
      `<a class="dlink" href="${lastURL}" download="IEP-draft.docx" target="_blank" rel="noopener">↓ Download IEP-draft.docx</a>
       <div class="lms">Don't forget to upload this document to the LMS once you've made any final adjustments.</div>
       <div class="fine">${kb} KB · built in your browser. If the download is blocked, right-click the link → Save link as.</div>`;
    say('Template filled. The download link is in the navy bar at the bottom of the plan — click it. Name, DOB, school, teacher, SSG members and dates are blank for you to complete in Word. It\'s a draft until the SSG agrees it.','note');
    $('build').textContent='Rebuild after edits';
  }catch(e){
    say('Couldn\'t fill it: '+e.message,'sys');
    $('build').textContent='Fill the DET template';
  }
  $('build').disabled=false;
};
