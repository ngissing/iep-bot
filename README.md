# IEP Goal Builder (NEFLN)

Drafts curriculum-linked IEP goals for the Victorian DET three-area IEP template
(Literacy, Numeracy, Wellbeing). Drafts only — goals are agreed at the SSG.

The app is a plain static site: no build step, no npm. What's in this folder is what
Cloudflare Pages serves. The AI call goes through a Cloudflare Worker (`worker/`) that
holds the Anthropic key, so no key is ever in these files.

## Common changes — where to make them

| I want to… | Edit |
|---|---|
| Change how the AI interviews or writes goals | `js/prompt.js` |
| Add or fix curriculum codes | `js/data/curriculum.js` (one record per line) |
| Update the school adjustments menu / MTSS tiers | `js/data/adjustments.js` |
| Update VCE VM PDS or VPC outcomes | `js/data/pds.js`, `js/data/vpc.js` |
| Swap in a new DET template | Replace `template/iep-template.docx` (must keep the 14-table, three-area layout) |
| Change the Worker address | `PROXY_URL` in `js/config.js` |
| Change colours or fonts | Tokens at the top of `css/app.css` |
| Change a plan check or warning | `js/checks.js` |
| Change rubric scoring | `js/rubric.js` |
| Change the opening message | `GREETING` in `js/main.js` |

Every other file is listed in [docs/design.md](docs/design.md).

## NEFLN logo

The header shows `assets/nefln-logo.png` (720×135, taken from the NEFLN website header).
If that file is missing, a text wordmark in the brand script font is shown instead.
For a sharper logo, replace it with an official copy (PNG or SVG, 140px+ tall) of the same name.
If you use an SVG, change the `src` in `index.html` to `assets/nefln-logo.svg`.

## Check before you push

```
node tests/run.mjs
```

All tests should pass. They cover the privacy guard, JSON repair, the plan checks,
rubric scoring, and that `index.html` doesn't point at a missing file.

## Try it locally

The page must be served over http (not opened from disk), because it loads the
template and data files:

```
py -m http.server 8765
```

then open http://localhost:8765. Chatting needs the Worker password; the Worker
must allow your origin (see below).

## Deploy (Cloudflare Pages via GitHub)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
4. Deploy. Every push to the main branch redeploys automatically.

## The Worker

`worker/worker.js` is the proxy (setup steps are in its header comment). It's deployed
separately as a Cloudflare Worker, not by Pages. Once the Pages address is known,
tighten `ALLOWED_ORIGIN` in the Worker from `'*'` to that address,
e.g. `'https://iep-goal-builder.pages.dev'`, and redeploy the Worker.
