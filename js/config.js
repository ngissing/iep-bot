/* Settings: where the Worker proxy lives.
   Part of the IEP Goal Builder. Plain script (not a module): loaded in order by
   index.html, sharing top-level names with the other files. */

/* ---------- proxy config ----------
   The app calls a Cloudflare Worker that holds the Anthropic key server-side, so no key
   is ever in this file. PROXY_URL below is Nick's deployed Worker — because it is set,
   the setup screen asks for the password ONLY. If the Worker is ever renamed or
   redeployed elsewhere, change this one line. */
const PROXY_URL = 'https://iep-proxy.nickgissing.workers.dev';
const PROXY_SET = !/REPLACE-WITH-YOUR-WORKER/.test(PROXY_URL);
/* The Worker address is configuration, not a secret — remembering it means the setup
   screen asks for ONE thing: the password. The password itself is never stored.
   Wrapped in try/catch because some sandboxed viewers block storage entirely. */
function rememberedUrl(){
  try { return localStorage.getItem('iep_proxy_url') || ''; } catch { return ''; }
}
function rememberUrl(u){
  try { localStorage.setItem('iep_proxy_url', u); } catch {}
}
let proxyUrl = PROXY_SET ? PROXY_URL : rememberedUrl();
let accessKey = '';
