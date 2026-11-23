/* Startup: greeting, new plan, resume, password gate.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

document.getElementById('cov').textContent =
  Object.entries(COVER).map(([a,s])=>a.replace('Personal and Social Capability','P&SC').replace('Health and Physical Education','HPE')+' '+s.size+' lvl').join(' · ');

/* ---------- new plan ----------
   Plans open with the start form (startform.js). GREETING is shown instead when the
   teacher picks "Skip — I'll type it instead". */
const GREETING = '**Start here — type in the box below.**\n\nThis builds a full IEP with three parts: **Literacy**, **Numeracy** and **Wellbeing**. Each gets a curriculum-linked long-term goal and short-term goals under it. We do one area at a time, and the plan fills in on the right as we go.\n\n**To begin, tell me in one message:**\n- Year level\n- Roughly where the student is working in each area\n- Any diagnosis or funded support\n- Which term the goals run for\n\nRough is fine. *"Year 8, working around Level 5 maths, well below in writing, fine socially. Dyslexia. Term 3."* is a perfect opening.\n\nUse a pseudonym — no real names, DOB, VSN or school name.';

/* Clearing `history` is the point, not a side effect: without it the previous student's
   details stay in the model's context and bleed into the next plan. The template stays
   loaded — it's the same blank DET file for every student. */
function reset(){
  plan = blankPlan();
  history = [];
  phase = 0;
  if (lastURL){ URL.revokeObjectURL(lastURL); lastURL = null; }
  $('dl').innerHTML = '';
  $('q').value = '';
  $('hits').innerHTML = 'Only codes in this list can be used. Anything else must be written “code to be confirmed by teacher”.';
  $('hits').className = 'fine';
  $('in').value = '';
  log.innerHTML = '';
  if ($('resume')) $('resume').style.display = 'flex';
  rail(); render();
  showStartForm();
  say('Previous plan cleared — chat history and all, so nothing carries over to the next student.','note');
}

let armed = null;
$('reset').onclick = ()=>{
  const empty = !AREAS.some(a=>plan.areas[a].goals.length || plan.areas[a].ltg)
                && !plan.assess && !history.length;
  if (empty){ reset(); return; }
  if (armed){                       // second click within 4s = do it
    clearTimeout(armed); armed = null;
    $('reset').classList.remove('armed');
    $('reset').textContent = 'New plan';
    reset();
    return;
  }
  $('reset').classList.add('armed');
  $('reset').textContent = 'Wipe this plan?';
  armed = setTimeout(()=>{          // disarm rather than sit there waiting to destroy work
    armed = null;
    $('reset').classList.remove('armed');
    $('reset').textContent = 'New plan';
  }, 4000);
};

$('minGoals').onchange = e=>{ drawGoals = +e.target.value; check(); };

/* ---------- resume a part-completed plan ---------- */
$('resumeBtn').onclick = ()=>$('resumeFile').click();
$('resumeFile').onchange = async e=>{
  const f = e.target.files[0]; if (!f) return;
  e.target.value = '';
  try{
    const loaded = await importPlan(f);
    plan = loaded;
    removeStartForm();
    const has = AREAS.filter(a=>plan.areas[a].goals.length || plan.areas[a].ltg);
    const gaps = AREAS.filter(a=>!plan.areas[a].goals.length && !plan.areas[a].ltg);
    if (!has.length){ say('That template opened, but every area was still empty — starting fresh from it.','note'); }
    phase = gaps.length ? Math.max(1, AREAS.indexOf(gaps[0])+1) : 4;
    rail(); render();
    const name = a=>AREA_LABEL[a].replace(' Goal','');
    say(`Loaded that draft.${has.length?' Already done: '+has.map(name).join(', ')+'.':''}${gaps.length?' Still to do: '+gaps.map(name).join(', ')+'.':' All three areas are drafted — review them, then build.'}`,'note');
    if (gaps.length)
      say(`Let's pick up with ${name(gaps[0])}. Tell me roughly where the student is working in that area, plus one strength and one barrier — and anything the previous person's notes don't already cover.`);
    $('resume').style.display = 'none';
  }catch(err){
    say('Couldn\'t read that file: ' + err.message + '. It needs to be a .docx built by this tool.','sys');
  }
};

let pendingSend = null;
function needsUrl(){ return !PROXY_SET && !proxyUrl; }

/* The password overlay covers the whole app until a password the Worker accepts is
   entered. While it's up, the app behind it is made inert so keyboard users can't tab
   into it. Called on load, and again if the Worker later rejects the password. */
function showGate(message){
  $('gate').style.display = 'flex';
  document.querySelectorAll('.top, .stepper, .wrap').forEach(el=>{ el.inert = true; });
  const err = $('gateErr');
  err.textContent = message || '';
  err.hidden = !message;
  if (needsUrl()) $('gateUrl').style.display = '';
  (needsUrl() ? $('gateUrl') : $('gateInput')).focus();
}
function hideGate(){
  $('gate').style.display = 'none';
  document.querySelectorAll('.top, .stepper, .wrap').forEach(el=>{ el.inert = false; });
  $('gateErr').hidden = true;
}

/* Checks a password with the Worker WITHOUT calling the AI. It sends an empty request:
   the Worker checks the password first and answers a wrong one with 401; a right one
   gets past that and is then refused for having no model (400), before anything reaches
   Anthropic. So 401/403 = wrong password, any other answer = accepted. Each check
   counts once toward the Worker's daily call cap, like one chat message would. */
async function verifyKey(key){
  const res = await fetch(proxyUrl, {
    method:'POST',
    headers:{'Content-Type':'application/json', 'X-Access-Key': key},
    body:'{}'
  });
  return !(res.status === 401 || res.status === 403);
}

let gateBusy = false;
async function submitGate(){
  if (gateBusy) return;
  if (needsUrl()){
    let u = $('gateUrl').value.trim().replace(/\/+$/,'');
    if (!u){ $('gateUrl').focus(); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;   // a bare host is the commonest slip
    proxyUrl = u;
  }
  const v = $('gateInput').value.trim();
  if (!v){ $('gateInput').focus(); return; }

  gateBusy = true;
  const btn = $('gateGo'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Checking…';
  try {
    const ok = await verifyKey(v);
    if (!ok){
      $('gateInput').value = '';
      showGate("That password wasn't accepted. Check it with whoever set up the tool and try again.");
      return;
    }
    if (!PROXY_SET) rememberUrl(proxyUrl);
    accessKey = v;
    $('gateInput').value = '';
    $('gateUrl').style.display = 'none';
    hideGate();
    $('in').focus();
    const t = pendingSend; pendingSend = null;
    if (t) ask(t);
  } catch (e) {
    if (!PROXY_SET) proxyUrl = '';   // a wrong address is the likeliest cause — ask for it again
    showGate(`Couldn't reach the server${PROXY_SET ? '' : ' at that address'}. Check your connection and try again.`);
  } finally {
    gateBusy = false;
    btn.disabled = false; btn.textContent = label;
  }
}
$('gateGo').onclick = submitGate;
$('gateInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submitGate(); });
$('gateUrl').addEventListener('keydown', e=>{ if(e.key==='Enter') $('gateInput').focus(); });
if (!needsUrl()) $('gateUrl').style.display = 'none';   // known address — password only

/* ---------- go ---------- */
$('send').onclick = ()=>{ const v=$('in').value.trim(); if(v){ $('in').value=''; $('in').style.height='auto'; ask(v);} };
$('in').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('send').click();} });
$('in').addEventListener('input',function(){ this.style.height='auto'; this.style.height=Math.min(120,this.scrollHeight)+'px'; });

rail(); render();
showStartForm();
showGate();   // password first — nothing in the app works without it
