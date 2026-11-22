/* Plan state, phases and the stepper.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- state ---------- */
const PHASES = ['Anchor','Literacy','Numeracy','Wellbeing','Build'];
const AREAS = ['literacy','numeracy','wellbeing'];
/* Flexi and some settings set ONE short-term goal per area per term; others want 2–3.
   drafts however many the teacher asks for, but the TEMPLATE only ever needs ONE per
   area. So this setting controls how many the model DRAFTS — it is not a validation
   floor. Drafting 2 and deleting the weaker one is a normal, encouraged workflow and
   must never raise a warning. The only real limits are: at least 1, at most 3. */
let drawGoals = 1;
const AREA_LABEL = {literacy:'Literacy Goal', numeracy:'Numeracy Goal', wellbeing:'Wellbeing Goal'};
const blankArea = ()=>({ltg:'', goals:[], strategies:[], evaluate:''});
const blankPlan = ()=>({year_level:'', assess:'', areas:{literacy:blankArea(), numeracy:blankArea(), wellbeing:blankArea()}});
let phase = 0;
let plan = blankPlan();
let history = [];

const $ = id => document.getElementById(id);
const log = $('log');

function rail(){
  $('rail').innerHTML = PHASES.map((p,i)=>`<b class="${i===phase?'on':i<phase?'done':''}">${i+1} ${p}</b>`).join('');
}
