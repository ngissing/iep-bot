# IEP Goal Builder V5 — design

Date: 2026-11-22. Status: approved by the owner ("Looks good, build it").

## Goal

Make V4 easier to maintain and give it a professional NEFLN-branded look.
**No behaviour changes**: the interview, AI prompt, curriculum rules, privacy guard,
checks, rubric scoring, DET template fill and re-import all work exactly as in V4.

## Hosting

Static site on Cloudflare Pages, deployed from GitHub. No build step: the files in
this folder are what gets served. The Cloudflare Worker (`worker/worker.js`) holds
the Anthropic key and is unchanged.

## Structure

| Path | Job |
|---|---|
| `index.html` | Markup only |
| `css/app.css` | All styling; NEFLN brand tokens at the top |
| `js/config.js` | Proxy URL, model, settings |
| `js/data/*.js` | Curriculum bank, adjustments menu, VCE VM PDS, VPC (one record per line) |
| `js/context.js` | Builds the curriculum/adjustments context sent to the AI |
| `js/state.js` | Plan state, phase stepper |
| `js/privacy.js` | VSN / DOB / school-name guard |
| `js/chat.js` | Chat rendering (markdown → safe HTML) |
| `js/prompt.js` | The system prompt |
| `js/parse.js` | JSON repair / reply parsing |
| `js/api.js` | Sending a message through the Worker |
| `js/form.js` | Plan form rendering and editing |
| `js/checks.js` | Plan checks (port of validate_plan.py) |
| `js/rubric.js` | DET Quality Checklist Rubric scoring |
| `js/lookup.js` | Curriculum search panel |
| `js/docx.js` | Fill and re-import the DET template |
| `js/main.js` | Greeting, new plan, resume, password gate, startup |
| `template/iep-template.docx` | The DET three-area template (was base64 inside V4) |
| `vendor/jszip.min.js` | JSZip 3.10.1, pinned local copy |
| `tests/` | Node tests for the pure logic |

Scripts are plain (non-module) scripts loaded in order, so the V4 code moves across
unchanged. The only code change: the DET template is fetched from
`template/iep-template.docx` the first time a plan is built, instead of decoded
from an inline base64 string.

## Look

NEFLN website palette: navy `#222C43`, red `#BC3A3A`, gold `#D8AE6E`,
slate `#556D7D`, periwinkle `#9CA7C2`; Open Sans. The NEFLN logo goes in the header.
The phase rail becomes a navy stepper bar; plan sections become cards; areas get a
navy edge; checks become coloured chips; the rubric gets meters; a typing indicator
replaces "thinking…"; the Build button sits in a sticky navy bar at the foot of the plan.
Red is kept for the primary action, the current stage and the DRAFT stamp.
Element IDs and class names used by the JS are kept, so restyling never touches logic.

## Testing

`node tests/run.mjs` covers JSON repair/parsing, the privacy guard, and the plan
checks. The DET template fill → re-import round trip is verified in a browser.
