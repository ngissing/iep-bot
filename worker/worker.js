/**
 * IEP goal builder — Cloudflare Worker proxy
 * ------------------------------------------------------------------
 * Holds the Anthropic API key server-side so it never ships in the app.
 * Checks a shared mentor password, forwards valid requests to Anthropic,
 * and caps daily spend so a runaway loop can't drain the account.
 *
 * SETUP (once):
 *   1. Create a Worker at dash.cloudflare.com → Workers & Pages → Create.
 *   2. Paste this file as the Worker code.
 *   3. Add two SECRETS (Settings → Variables and Secrets → add Secret — NOT plaintext vars):
 *        ANTHROPIC_KEY   your Anthropic API key (sk-ant-...)
 *        ACCESS_KEY      the password you give Flexi mentors
 *   4. Bind a KV namespace for the daily counter (Settings → Bindings → KV):
 *        variable name: COUNTER    namespace: iep-usage (create it)
 *   5. Set ALLOWED_ORIGIN below to where the app is served from, or leave '*'
 *      while testing. Deploy, then put the Worker URL into the app's PROXY_URL.
 *
 * The app sends the mentor password in the X-Access-Key header. This Worker
 * never returns the Anthropic key and never logs message content.
 */

const ALLOWED_ORIGIN = '*';           // tighten to your host once deployed, e.g. 'https://iep.example.edu.au'
const DAILY_CALL_CAP = 500;           // max Anthropic calls per UTC day across all mentors
const MODEL_ALLOWLIST = ['claude-sonnet-4-6'];  // the app only uses this; reject anything else

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra,
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: cors({ 'Content-Type': 'application/json' }),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method !== 'POST') return json(405, { error: { message: 'POST only' } });

    // 1. auth — constant-time-ish compare of the shared password
    const given = request.headers.get('X-Access-Key') || '';
    if (!env.ACCESS_KEY || given.length !== env.ACCESS_KEY.length || given !== env.ACCESS_KEY) {
      return json(401, { error: { message: 'Invalid access password' } });
    }

    // 2. daily spend cap (best-effort; KV is eventually consistent but fine for a soft cap)
    let count = 0;
    if (env.COUNTER) {
      const day = new Date().toISOString().slice(0, 10);
      const key = `calls:${day}`;
      count = parseInt((await env.COUNTER.get(key)) || '0', 10);
      if (count >= DAILY_CALL_CAP) {
        return json(429, { error: { message: 'Daily usage cap reached' } });
      }
      // increment with a 2-day TTL so old counters clean themselves up
      await env.COUNTER.put(key, String(count + 1), { expirationTtl: 172800 });
    }

    // 3. read + sanity-check the body; only forward what the app is allowed to send
    let body;
    try { body = await request.json(); }
    catch { return json(400, { error: { message: 'Bad JSON' } }); }

    if (!MODEL_ALLOWLIST.includes(body.model)) {
      return json(400, { error: { message: 'Model not allowed' } });
    }
    body.max_tokens = Math.min(body.max_tokens || 4000, 8000);  // hard ceiling regardless of caller

    // 4. forward to Anthropic with the server-held key
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model,
        max_tokens: body.max_tokens,
        system: body.system,
        messages: body.messages,
      }),
    });

    // 5. relay the response verbatim (with CORS), so the app's parsing is unchanged
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: cors({ 'Content-Type': 'application/json' }),
    });
  },
};
