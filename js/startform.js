/* Start form: the fixed opening questions as a form, so every plan starts the same way.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files.

   On submit it composes ONE message headed "START FORM" and sends it through ask(),
   exactly as if the teacher had typed it — so the privacy guard, history and the AI's
   anchor step all work as before. The prompt (prompt.js) tells the AI that a START FORM
   message answers the anchor, so the chat takes over with follow-up questions.
   To add or change a question: edit START_FIELDS below; the message builds itself. */

const LEVELS = ['Not sure yet', 'Below Foundation (Levels A–D)', 'Foundation',
  ...Array.from({length:10}, (_,i)=>`Level ${i+1}`)];

const START_FIELDS = [
  { id:'year', label:'Year level', type:'select', required:true,
    options:['', 'Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'] },
  { id:'pathway', label:'Pathway', type:'select',
    options:['Victorian Curriculum', 'VCE Vocational Major', 'Victorian Pathways Certificate (VPC)'] },
  { id:'lit', label:'Literacy working level', type:'select', options:LEVELS, hint:'English' },
  { id:'num', label:'Numeracy working level', type:'select', options:LEVELS, hint:'Mathematics' },
  { id:'wb',  label:'Wellbeing working level', type:'select', options:LEVELS, hint:'Personal and Social Capability' },
  { id:'when', label:'Goals run until', type:'select', required:true,
    options:['', 'End of Term 1','End of Term 2','End of Term 3','End of Term 4',
             'End of Semester 1','End of Semester 2','End of the year'] },
  { id:'dx', label:'Diagnosis or funded support', type:'text', wide:true,
    placeholder:'Dyslexia; PSD funded — or leave blank',
    hint:'Only what has been formally identified. Leave blank if none.' },
];

/* the message the AI receives — one line per field, labels as shown on the form */
function startFormMessage(v){
  return [
    'START FORM',
    `Year level: ${v.year.replace('Year ','')}`,
    `Pathway: ${v.pathway}`,
    `Working level — Literacy: ${v.lit}`,
    `Working level — Numeracy: ${v.num}`,
    `Working level — Wellbeing: ${v.wb}`,
    `Diagnosis / funded support: ${v.dx || 'None stated'}`,
    `Timeframe: ${v.when}`,
  ].join('\n');
}

function fieldHtml(f){
  const id = 'sf_' + f.id;
  const control = f.type === 'select'
    ? `<select id="${id}" ${f.required?'required':''}>${f.options.map(o=>
        `<option value="${esc(o)}">${o ? esc(o) : 'Choose…'}</option>`).join('')}</select>`
    : `<input id="${id}" type="text" autocomplete="off" spellcheck="true" placeholder="${esc(f.placeholder||'')}">`;
  return `<label class="sf-field${f.wide?' wide':''}" for="${id}">
      <span class="sf-label">${esc(f.label)}${f.required?' <i>required</i>':''}</span>
      ${control}
      ${f.hint ? `<span class="sf-hint">${esc(f.hint)}</span>` : ''}
    </label>`;
}

function showStartForm(){
  const card = document.createElement('form');
  card.className = 'msg bot startform';
  card.id = 'startForm';
  card.noValidate = true;
  card.innerHTML = `
    <div class="sf-head">
      <b>Start a new plan</b>
      <span>This builds a full IEP in three parts — <strong>Literacy</strong>, <strong>Numeracy</strong> and <strong>Wellbeing</strong>. Fill in what you know; the chat takes over from there and asks about anything else.</span>
    </div>
    <div class="sf-grid">${START_FIELDS.map(fieldHtml).join('')}</div>
    <div class="sf-err" id="sfErr" role="alert" hidden></div>
    <div class="sf-actions">
      <button type="submit" class="sf-go">Start the plan</button>
      <button type="button" class="sf-skip" id="sfSkip">Skip — I'll type it instead</button>
    </div>
    <div class="sf-fine">Use a pseudonym — no real names, DOB, VSN or school name.</div>`;
  log.appendChild(card);
  log.scrollTop = 0;

  card.addEventListener('submit', e=>{
    e.preventDefault();
    const v = {};
    START_FIELDS.forEach(f=>{ v[f.id] = $('sf_'+f.id).value.trim(); });
    const missing = START_FIELDS.filter(f=>f.required && !v[f.id]).map(f=>f.label);
    const err = $('sfErr');
    if (missing.length){
      err.textContent = `Still needed: ${missing.join(', ')}.`;
      err.hidden = false;
      $('sf_' + START_FIELDS.find(f=>f.required && !v[f.id]).id).focus();
      return;
    }
    const text = startFormMessage(v);
    const bad = guard(text);
    if (bad){ err.textContent = bad; err.hidden = false; $('sf_dx').focus(); return; }
    card.remove();
    ask(text);
  });
  card.addEventListener('input', ()=>{ $('sfErr').hidden = true; });
  $('sfSkip').onclick = ()=>{
    card.remove();
    say(GREETING).classList.add('opening');
    $('in').focus();
  };
}

/* the form only makes sense before the conversation starts */
function removeStartForm(){
  const f = $('startForm'); if (f) f.remove();
}
