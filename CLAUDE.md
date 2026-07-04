# AI-Delegated Deliberation Slides

HTML slide deck for the Habermolt talk **"Delegating Deliberation to AI Representatives"**
(Joseph Low & Oscar Duys, Supercooperation, 5 July 2026). Built with the `frontend-slides`
skill; no build step, no dependencies.

## Files

- `index.html` — the entire deck: 33 slides, all CSS/JS inline. This is the only file you edit.
- `assets/` — images, already resized/compressed for the web. Referenced by relative path.
- `habermolt-deck.pdf` — static export (untracked); regenerate after edits, don't hand-edit.
- `.frontend-slides/` (gitignored) — extraction scratch from the original pptx. The full-resolution
  originals live in `5th July 26' @Supercooperation.pptx` (also gitignored via `*.pptx`) and can be
  re-extracted with the frontend-slides skill's `extract-pptx.py` if a new asset is needed.
- `CAIF Habermolt Blogpost.docx` — source prose for most slide copy (hook, paradigm framing,
  representation/aggregation/revision findings). Quote it before inventing new wording.

## Deployment

Pushing to `main` auto-deploys via GitHub Pages (legacy branch build, `main` root):
<https://jolow99.github.io/ai-delegated-deliberation-slides/>

So: edit → verify locally → commit → push. Builds take ~1 min. If the site 404s for several
minutes, kick a rebuild: `gh api repos/jolow99/ai-delegated-deliberation-slides/pages/builds -X POST`.

PDF export (uses the frontend-slides skill script, needs Playwright):

```sh
bash ~/.claude/skills/frontend-slides/scripts/export-pdf.sh index.html habermolt-deck.pdf
```

## Deck architecture — the rules that must not break

- **Fixed 16:9 stage.** Every slide is authored at exactly **1920×1080** and the whole stage is
  scaled to the viewport by JS. Never add responsive breakpoints or reflow content per device;
  use fixed px values everywhere inside slides.
- Slide visibility is `visibility`/`opacity` via `.active`/`.visible` — never `display:none`.
- **Nothing may overflow the frame** (the double border inset 44px). The usable content box is
  `.content` (top 196 / sides 150 / bottom 150 → ~734px of height). If content doesn't fit,
  split into two slides; don't shrink text below ~24px.
- Each slide carries its own chrome: `.frame`, `.masthead` (section label left, HABERMOLT right),
  `.rule`, `.folio` ("n / 33"). **Folios are hardcoded** — adding/removing a slide means renumbering
  every folio after it and the total on all slides (search `"/ 33"`).
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

Speaker notes live as HTML comments above their slide (e.g. the Lewis "cherry-picked" rebuttal
context above slide 26).

## Images

- Keep assets under ~500KB: photos/figures as `.jpg` (quality ~87), charts/UI with sharp text or
  few colors as `.png`. Max width ~1500px. Watch the extensions — e.g. `chart-aggregation` is
  a `.png`; a wrong extension fails silently as a broken image.
- The mascot/comic images have **white backgrounds**, which is why everything sits in white
  `.plate` cards — don't place them directly on the cream paper.
- Never let a stacked column of plates exceed the content box: compute
  `height = (imgHeight/imgWidth) × plateWidth + ~26px padding + ~40px caption` per plate.

## Verify before pushing (required)

Screenshot every slide headlessly and eyeball for overflow/overlap/broken images — `scrollHeight`
checks are not enough. Playwright pattern that works here:

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
