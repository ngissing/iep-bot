/* Turning the AI reply into JSON, repairing it where possible.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* The model returns JSON. If it comes back truncated or wrapped in stray prose,
   pull out what we can rather than showing the teacher raw JSON. */
/* The model must return JSON. Two different things go wrong, and they look identical
   from the outside:
     (a) genuinely truncated — the response hit max_tokens mid-object
     (b) complete but malformed — most often a raw newline or tab inside a string value,
         which JSON.parse rejects outright
   (b) is common and fully recoverable, so repair it first. Telling the teacher their
   reply was "cut off" when nothing was cut is a lie that sends them re-asking for
   content that already arrived. */
function repairJSON(s){
  let out='', inStr=false, esc=false;
  for (const ch of s){
    if (esc){ out+=ch; esc=false; continue; }
    if (ch==='\\'){ out+=ch; esc=true; continue; }
    if (ch==='"'){ inStr=!inStr; out+=ch; continue; }
    if (inStr){
      if (ch==='\n'){ out+='\\n'; continue; }
      if (ch==='\r'){ out+='\\r'; continue; }
      if (ch==='\t'){ out+='\\t'; continue; }
    }
    out+=ch;
  }
  return out;
}

function parseReply(raw){
  try { return JSON.parse(raw); } catch {}
  try { return JSON.parse(repairJSON(raw)); } catch {}
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a > -1 && b > a){
    const slice = raw.slice(a,b+1);
    try { return JSON.parse(slice); } catch {}
    try { return JSON.parse(repairJSON(slice)); } catch {}
  }
  // genuinely incomplete: recover the reply, and any COMPLETE pieces of the patch.
  const fixed = repairJSON(raw);
  const out = { salvaged: true, reply: '' };
  const m = fixed.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (m){
    let s = m[1];
    try { s = JSON.parse('"' + s.replace(/\\?$/,'') + '"'); }
    catch { s = s.replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\\\/g,'\\'); }
    out.reply = s.trim();
  } else { out.reply = raw; }
  const ph = fixed.match(/"phase"\s*:\s*(\d)/); if (ph) out.phase = +ph[1];
  const patch = {};
  const yl = fixed.match(/"year_level"\s*:\s*"([^"]*)"/); if (yl) patch.year_level = yl[1];
  AREAS.forEach(a=>{
    const key = `"${a}"`, ki = fixed.indexOf(key);
    if (ki < 0) return;
    const brace = fixed.indexOf('{', ki); if (brace < 0) return;
    let depth = 0;
    for (let i = brace; i < fixed.length; i++){
      if (fixed[i] === '{') depth++;
      else if (fixed[i] === '}'){ depth--; if (depth === 0){
        try { (patch.areas = patch.areas||{})[a] = JSON.parse(fixed.slice(brace, i+1)); } catch {}
        break;
      }}
    }
  });
  if (patch.year_level || patch.areas) out.patch = patch;
  return out;
}
