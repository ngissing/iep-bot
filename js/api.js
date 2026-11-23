/* Sending a message to the AI via the Worker proxy.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

async function ask(text){
  if (!accessKey){ pendingSend = text; showGate(); return; }
  const bad = guard(text);
  if (bad){ say(bad,'sys'); return; }
  say(text,'you');
  removeStartForm();   // typing in the chat instead of using the form is fine too
  const rb = $('resume'); if (rb) rb.style.display = 'none';
  history.push({role:'user',content:text});
  $('send').disabled = true;
  const t = say('thinking…'); t.classList.add('think');

  const relevant = codeContext(history.map(h=>h.content).join(' '), text);
  try{
    const res = await fetch(proxyUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json', 'X-Access-Key': accessKey},
      body:JSON.stringify({
        model:'claude-sonnet-4-6', max_tokens:8000,
        system: SYSTEM + '\n\nCODES YOU MAY CITE (nothing else exists):\n' + relevant +
                '\n\n' + adjustmentsContext() +
                (()=>{ const c = history.map(h=>h.content).join(' ');
                  if (/\bVPC\b|vocational pathways/i.test(c)) return '\n\n' + vpcContext();
                  if (/\b(VM|VCAL|vocational major)\b|Personal Development/i.test(c)) return '\n\n' + pdsContext();
                  return ''; })() +
                `\n\nGOAL COUNT: draft exactly ${drawGoals} short-term goal${drawGoals>1?'s':''} per area. The DET template only requires ONE per area; where more than one is drafted the teacher picks the strongest and deletes the rest, so make each genuinely distinct rather than a reworded twin.` +
                '\n\nCURRENT PLAN STATE:\n' + JSON.stringify(plan),
        messages: history
      })
    });
    if (res.status === 401 || res.status === 403){
      t.remove();
      say('That access password is no longer accepted. Enter it again to carry on — nothing in the plan was lost.','sys');
      accessKey = ''; $('send').disabled = false;
      showGate('The password was rejected. It may have been changed — check with whoever set up the tool.');
      return;
    }
    if (res.status === 429){
      t.remove();
      say('The tool has hit its usage cap for now — this protects the shared account. Try again later, or let the administrator know.','sys');
      $('send').disabled = false; return;
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'API error');
    const raw = data.content.filter(c=>c.type==='text').map(c=>c.text).join('').replace(/```json|```/g,'').trim();
    const out = parseReply(raw);
    t.remove();
    say(out.reply || '(no reply)');
    if (out.salvaged){
      const got = out.patch && out.patch.areas ? Object.keys(out.patch.areas) : [];
      const cut = data.stop_reason === 'max_tokens';
      const what = cut ? 'That reply was cut off by the length limit' : 'That reply came back in a format I had to unpick';
      say(got.length
        ? `${what}. I recovered: ${got.join(', ')}. Any area not listed didn't arrive — ask for just that one and it'll fill in.`
        : `${what}, and no area came through complete. Nothing already in the plan was lost — ask again and it'll fill in.`,'note');
    }
    if (data.stop_reason === 'max_tokens' && !out.salvaged)
      say('That reply hit the length limit. Check the form below matches what you expected.','note');
    history.push({role:'assistant',content:raw});
    if (typeof out.phase === 'number'){ phase = Math.max(phase, Math.min(4,out.phase)); rail(); }
    if (out.patch){
      const p = out.patch;
      if ('year_level' in p) plan.year_level = p.year_level;
      if ('assess' in p) plan.assess = p.assess;
      if (p.areas) AREAS.forEach(a=>{ if (p.areas[a]) Object.assign(plan.areas[a], p.areas[a]); });
      render();
    }
  }catch(e){
    t.remove();
    const net = /failed to fetch|networkerror|load failed/i.test(e.message);
    if (net && !PROXY_SET){
      // a remembered address that doesn't answer is worse than none — forget it so the
      // setup screen asks again rather than silently retrying a dead host
      try { localStorage.removeItem('iep_proxy_url'); } catch {}
      proxyUrl = '';
      const uf = $('gateUrl'); if (uf) uf.style.display = '';
    }
    say(net
      ? `Couldn't reach the server at ${proxyUrl || 'that address'}. Usually the address is wrong, the Worker isn't deployed, or the page was opened straight from disk. Send again and you'll be asked for the address. Nothing in the plan was lost.`
      : 'That request didn\'t get through: ' + e.message + '. Try again — nothing in the plan was lost.','sys');
    accessKey = '';
  }
  $('send').disabled = false;
}
