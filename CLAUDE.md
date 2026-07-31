# AI-Delegated Deliberation Slides

HTML slide deck for the Habermolt talk **"Delegating Deliberation to AI Representatives"**
(Joseph Low & Oscar Duys, Supercooperation, 5 July 2026). Built with the `frontend-slides`
skill; no build step, no dependencies.

## Files

- `index.html` — the entire deck: 30 slides, all CSS/JS inline. This is the **current/live working deck**
  (retargeted per talk — venue/date edited in place). This is the only deck file you edit.
- `assets/` — images, already resized/compressed for the web. Referenced by relative path.
- `presentations/<date>-<slug>/` — **frozen history of past talks**, each fully self-contained
  (its own `index.html`, its own `assets/` copy and its own `deck.pdf`, so root edits can't break it).
  Never hand-edit these. When a talk is finished, freeze it:
  `git show <tag-or-ref>:index.html > presentations/<date>-<slug>/index.html`,
  `cp -R assets presentations/<date>-<slug>/assets`, then export `deck.pdf` into the same folder
  (see below). Update `presentations/README.md`, which indexes them.
  Each is also live at `…/presentations/<date>-<slug>/`.
- `scripts/export-deck-pdf.mjs` — PDF exporter, see Deployment below.
- `habermolt-deck.pdf` — static export of the root deck (untracked, gitignored, not kept in the
  working tree); regenerate on demand, don't hand-edit.
**Source material no longer in the working tree** (removed 30 July 2026 to keep the repo clean).
`assets/` is now self-sufficient — the deck references nothing outside it — but note that those
files are web-compressed (~900px), so **no full-resolution imagery survives in the repo**. Don't
promise a print-quality or re-cropped version of a photo without first recovering an original.

- `CAIF Habermolt Blogpost.docx` — source prose for most slide copy (hook, paradigm framing,
  representation/aggregation/revision findings). Quote it before inventing new wording. It stays
  recoverable from git history:
  `git show 0c63b93:"CAIF Habermolt Blogpost.docx" > "CAIF Habermolt Blogpost.docx"`
- `5th July 26' @Supercooperation.pptx` — the original PowerPoint, and the ancestor of every image
  in `assets/`. **Never committed**, so git cannot bring it back; moved to the macOS Trash.
- `.frontend-slides/` — extraction scratch the frontend-slides skill produced from that pptx
  (69 full-resolution images, `extracted-slides.json`, and `blogpost.txt`). Also never committed,
  also moved to the macOS Trash.

If you need an original and both are past the Trash, ask Joseph for the pptx and re-extract with
the frontend-slides skill's `extract-pptx.py`.

## Deployment

Pushing to `main` auto-deploys via GitHub Pages (legacy branch build, `main` root):
<https://jolow99.github.io/ai-delegated-deliberation-slides/>

So: edit → verify locally → commit → push. Builds take ~1 min. If the site 404s for several
minutes, kick a rebuild: `gh api repos/jolow99/ai-delegated-deliberation-slides/pages/builds -X POST`.

PDF export — use `scripts/export-deck-pdf.mjs`, **not** the frontend-slides skill script.
The skill script only force-shows `.reveal` elements, so every `.frag[data-fstep]` step-through
build (e.g. the slide-31 table) exports blank, and it bakes the on-screen nav counter into the
page. Ours drives the deck's own `deck.show(i, true)` and hides the live chrome.

Needs Playwright + Chromium. The repo stays dependency-free, so install them out of tree once
and point `PLAYWRIGHT_DIR` at that directory (omit it if `playwright` is installed in the repo):

```sh
mkdir -p /tmp/pw && (cd /tmp/pw && npm init -y && npm i playwright && npx playwright install chromium)

export PLAYWRIGHT_DIR=/tmp/pw
node scripts/export-deck-pdf.mjs . index.html habermolt-deck.pdf                    # root deck
node scripts/export-deck-pdf.mjs presentations/<folder> index.html \
     presentations/<folder>/deck.pdf                                                # an archive
```

It aborts on any broken image, so a failed export is a real signal. Expect ~10MB for 30 slides.

## Deck architecture — the rules that must not break

- **Fixed 16:9 stage.** Every slide is authored at exactly **1920×1080** and the whole stage is
  scaled to the viewport by JS. Never add responsive breakpoints or reflow content per device;
  use fixed px values everywhere inside slides.
- Slide visibility is `visibility`/`opacity` via `.active`/`.visible` — never `display:none`.
- **Nothing may overflow the frame** (the double border inset 44px). The usable content box is
  `.content` (top 196 / sides 150 / bottom 150 → ~734px of height). If content doesn't fit,
  split into two slides; don't shrink text below ~24px.
- Each slide carries its own chrome: `.frame`, `.masthead` (section label left, HABERMOLT right),
  `.rule`, `.folio` ("n / 30"). **Folios are hardcoded** — adding/removing a slide means renumbering
  every folio after it and the total on all slides (search `"/ 30"`), plus the `#deckCounter` div
  near the bottom of the file.
- Entrance animation: give elements `class="reveal d1"`…`d6` (stagger delays). Plates keep their
  tilt via `.reveal.tilt-l` / `.tilt-r` overrides — if you add a new rotated class, add the matching
  `.slide.visible .reveal.<class>` rule or the tilt vanishes after reveal.

## Design system ("Paper & Ink")

Warm cream paper `--paper`, charcoal `--ink`, crimson accent `--crimson` (echoes the lobster),
Cormorant Garamond for display, Source Serif 4 for body. Tokens are CSS variables in `:root`.

Reusable pieces (match these before inventing new ones):

- `.kicker` — small crimson italic eyebrow above a headline
- `h2.headline` — slide title; `<em>` inside it goes crimson italic
- `.lede` — muted italic intro paragraph
- `ul.ed-list` — em-dash bulleted list; `<b>` for emphasis, `<i>` for muted asides
- `.verdict` — crimson italic pull-quote ("It scales — but it doesn't listen.")
- `.plate` — white framed figure card with optional `figcaption`; add `.tilt-l`/`.tilt-r`
- Layouts: `.split` (text + figure columns), `.statement` (single centred thought),
  divider slides (`.divider-num`, `.divider-title`, `.divider-sub`)

Speaker notes live as HTML comments above their slide.

## Images

- Keep assets under ~500KB: photos/figures as `.jpg` (quality ~87), charts/UI with sharp text or
  few colors as `.png`. Max width ~1500px. Watch the extensions — e.g. `chart-aggregation` is
  a `.png`; a wrong extension fails silently as a broken image.
- The mascot/comic images have **white backgrounds**, which is why everything sits in white
  `.plate` cards — don't place them directly on the cream paper.
- Never let a stacked column of plates exceed the content box: compute
  `height = (imgHeight/imgWidth) × plateWidth + ~26px padding + ~40px caption` per plate.

## Verifying visually (only when asked, or when layout is genuinely at risk)

Don't screenshot the deck by default — it's slow and token-hungry. Reach for it only when a change
plausibly breaks layout (new/resized imagery, dense content near the content-box limit) or when
Joseph asks. Playwright pattern that works here:

```js
await page.goto('file://…/index.html', {waitUntil: 'networkidle'});
const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
for (let i = 0; i < n; i++) {
  await page.evaluate(i => deck.show(i), i);     // `deck` is the global controller
  await page.waitForTimeout(900);                 // let reveals finish
  await page.screenshot({path: `slide-${i+1}.png`});
}
// broken images:
await page.evaluate(() => [...document.images].filter(im => !im.naturalWidth).map(im => im.src));
```

## Misc

- Navigation: arrows/space/wheel/swipe; URL hash deep-links (`#26`).
- The in-browser editor (press `E`, Cmd+S to download) saves to **localStorage only** — real
  changes must be edited into `index.html` and pushed. If a slide's text mysteriously ignores
  your edits during local preview, clear the `habermolt-deck-edits-v1` localStorage key.
- Team slide headshots: Lewis Hammond is the blond one, Michiel Bakker has curly dark hair
  (they were swapped once already — filenames are now correct).
