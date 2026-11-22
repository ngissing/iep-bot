/* Chat rendering.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* The model writes light markdown. Escape FIRST, then apply formatting — never the other
   way round, or model output could inject HTML into the page. */
function mdToHtml(s){
  let h = String(s).replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  h = h.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>');
  h = h.replace(/(^|[\s(])(\*|_)(?=\S)([^*_\n]*?\S)\2(?=[\s.,;:!?)]|$)/g, '$1<em>$3</em>');
  // bullet and numbered lines become list items; everything else keeps its line break
  const lines = h.split('\n');
  let out = '', inList = false, listTag = '';
  const close = ()=>{ if (inList){ out += `</${listTag}>`; inList = false; } };
  lines.forEach(line=>{
    const b = line.match(/^\s*[-*•]\s+(.*)$/);
    const n = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (b || n){
      const tag = b ? 'ul' : 'ol';
      if (inList && listTag !== tag) close();
      if (!inList){ out += `<${tag}>`; inList = true; listTag = tag; }
      out += `<li>${(b||n)[1]}</li>`;
    } else {
      close();
      out += line.trim() === '' ? '<br>' : line + '<br>';
    }
  });
  close();
  return out.replace(/(<br>)+$/,'');
}

function say(text, cls='bot'){
  const d = document.createElement('div');
  d.className = 'msg ' + cls;
  d.innerHTML = mdToHtml(text);
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}
