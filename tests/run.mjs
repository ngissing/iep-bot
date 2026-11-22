// Run with:  node tests/run.mjs
// Loads the app's plain scripts into a sandbox with a tiny fake DOM and checks the
// logic that's easiest to break while editing: privacy guard, JSON repair, plan checks,
// rubric scoring, and that index.html only references files that exist.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(path.join(root, p), 'utf8');

const fakeEl = () => ({ innerHTML:'', textContent:'', value:'', disabled:false, style:{}, dataset:{},
  classList:{ add(){}, remove(){} }, appendChild(){}, addEventListener(){}, querySelectorAll(){ return []; } });
const els = {};
const sandbox = {
  console,
  document: {
    getElementById: id => (els[id] ??= fakeEl()),
    querySelector: () => fakeEl(), querySelectorAll: () => [],
    createElement: () => fakeEl(), activeElement: null,
  },
};
vm.createContext(sandbox);
// Load as ONE script so top-level const/let are shared, exactly as in the browser.
const files = ['js/data/curriculum.js','js/context.js','js/state.js','js/privacy.js','js/parse.js','js/form.js','js/checks.js','js/rubric.js'];
vm.runInContext(files.map(read).join('\n;\n') +
  '\n;globalThis.__app = {guard, repairJSON, parseReply, check, scoreRubric, blankPlan, CURRICULUM, setPlan: p => { plan = p; }};', sandbox);
const app = sandbox.__app;

const code = prefix => app.CURRICULUM.find(r => r.c.startsWith(prefix)).c;
function goodPlan(){
  const p = app.blankPlan();
  p.year_level = '9';
  p.assess = 'STRENGTHS AND INTERESTS\nFootball, storytelling.\n\nENTRY-LEVEL SKILLS\nPAT Reading 112, Level 6.\n\nCHALLENGES AND BARRIERS\nAvoids starting, which means a planner is needed.\n\nSTUDENT VOICE — to be gathered before the SSG';
  p.areas.literacy = {
    ltg: 'Write paragraphs with topic sentences.\nCurriculum link: ' + code('VC2E') + ' | English',
    goals: [{ n:'1', action:'will write a topic sentence', conditions:'using a football planner', success:'in 4 of 5 tasks', by_when:'end of Term 3' }],
    strategies: [{ goal:'1', strategies:'TEACH: model.\nPRACTISE: weekly.\nREINFORCE: praise.\nSSG: parent asks.', responsible:'Teacher; parent/carer' }],
    evaluate: 'Review week 5 at SSG using work samples.',
  };
  return p;
}
function runCheck(p){
  app.setPlan(p);
  const ok = app.check();
  return { ok, html: els.checks.innerHTML };
}

test('privacy guard blocks VSN, DOB and school names, passes clean text', () => {
  assert.match(app.guard('VSN 123456789'), /student number/);
  assert.match(app.guard('born 3/4/2010'), /date of birth/);
  assert.match(app.guard('Goes to Wodonga Senior Secondary College'), /names a school/);
  assert.equal(app.guard('Year 9, Level 6 literacy, loves footy'), null);
});

test('parseReply repairs raw newlines inside strings', () => {
  const raw = '{"reply":"line one\nline two","phase":1}';
  const out = app.parseReply(raw);
  assert.equal(out.reply, 'line one\nline two');
  assert.equal(out.phase, 1);
  assert.ok(!out.salvaged);
});

test('parseReply salvages a complete area from a truncated reply', () => {
  const raw = '{"reply":"Done","phase":2,"patch":{"areas":{"literacy":{"ltg":"x","goals":[]},"numeracy":{"ltg":"cut of';
  const out = app.parseReply(raw);
  assert.ok(out.salvaged);
  assert.equal(out.reply, 'Done');
  assert.equal(Object.keys(out.patch.areas).join(), 'literacy');
});

test('a well-formed plan passes with no errors', () => {
  const r = runCheck(goodPlan());
  assert.equal(r.ok, true);
  assert.doesNotMatch(r.html, /ERROR/);
});

test('an invented curriculum code is an error that blocks the build', () => {
  const p = goodPlan();
  p.areas.literacy.ltg = 'x\nCurriculum link: VC2E9ZZ99 | English';
  const r = runCheck(p);
  assert.equal(r.ok, false);
  assert.match(r.html, /VC2E9ZZ99 is not in the bundled curriculum/);
});

test('an HPE Movement code in Wellbeing is an error', () => {
  const p = goodPlan();
  const mv = app.CURRICULUM.find(r => /^VC2HP\d+M/.test(r.c));
  if (!mv) return; // bank has no Movement codes — nothing to test
  p.areas.wellbeing = { ...goodPlan().areas.literacy, ltg: 'x\nCurriculum link: ' + mv.c };
  assert.equal(runCheck(p).ok, false);
});

test('vague measures, deficit framing and diagnosis goals are flagged', () => {
  const p = goodPlan();
  Object.assign(p.areas.literacy.goals[0], { success:'will improve', action:'will stop calling out' });
  const html = runCheck(p).html;
  assert.match(html, /isn&#39;t a count|isn't a count, rate or threshold/);
  assert.match(html, /absence of a behaviour/);
  p.areas.literacy.goals[0].action = 'will manage their ADHD';
  assert.match(runCheck(p).html, /fix a diagnosis/);
});

test('"will add fractions" is NOT mistaken for a diagnosis goal', () => {
  const p = goodPlan();
  p.areas.literacy.goals[0].action = 'will add fractions with unlike denominators';
  assert.doesNotMatch(runCheck(p).html, /fix a diagnosis/);
});

test('rubric scores indicators 2–7', () => {
  app.setPlan(goodPlan());
  const I = app.scoreRubric();
  assert.equal(I.map(i => i.n).join(), '2,3,4,5,6,7');
  I.forEach(i => assert.ok(i.score >= 1 && i.score <= 3));
});

test('index.html only references files that exist', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])
    .filter(u => !/^(https?:|#|data:)/.test(u));
  // the logo is optional: the header falls back to a text wordmark without it
  for (const r of refs.filter(r => r !== 'assets/nefln-logo.png'))
    assert.ok(existsSync(path.join(root, r)), `missing ${r}`);
  assert.ok(existsSync(path.join(root, 'template/iep-template.docx')), 'missing DET template');
});
