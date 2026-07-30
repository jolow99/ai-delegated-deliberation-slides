// export-deck-pdf.mjs — render a Habermolt deck to PDF, one 1920x1080 page per slide.
// Uses the deck's own controller (`deck.show(i, true)`) so `.frag` step-through
// content is fully revealed, which the generic frontend-slides skill script misses.
//
// usage: node scripts/export-deck-pdf.mjs <serve-dir> <html-file> <out.pdf> [screenshot-dir]
//
// The repo has no dependencies of its own, so Playwright is expected to live somewhere
// else; point PLAYWRIGHT_DIR at a directory that has it installed. See CLAUDE.md.

import { createServer } from 'http';
import { createRequire } from 'module';
import { readFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname, resolve } from 'path';
import { pathToFileURL } from 'url';

// ESM ignores NODE_PATH and resolves bare specifiers from this file's own location,
// so an out-of-tree install has to be resolved by hand.
const { chromium } = await (async () => {
  try {
    return await import('playwright');
  } catch (e) {
    const dir = process.env.PLAYWRIGHT_DIR;
    if (!dir) {
      console.error('playwright not found. Install it somewhere and pass its location:\n' +
        '  mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright && npx playwright install chromium\n' +
        '  PLAYWRIGHT_DIR=/tmp/pw node scripts/export-deck-pdf.mjs ...');
      process.exit(1);
    }
    const req = createRequire(join(resolve(dir), 'noop.js'));
    const mod = await import(pathToFileURL(req.resolve('playwright')).href);
    // resolved by path, playwright's CJS exports land under .default
    return mod.chromium ? mod : mod.default;
  }
})();

const [SERVE_DIR, HTML_FILE, OUTPUT_PDF, SHOT_DIR = '/tmp/deck-shots'] = process.argv.slice(2);
const W = 1920, H = 1080;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

const server = createServer((req, res) => {
  const path = join(SERVE_DIR, decodeURIComponent(req.url) === '/' ? HTML_FILE : decodeURIComponent(req.url));
  try {
    const body = readFileSync(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const port = await new Promise(r => server.listen(0, () => r(server.address().port)));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });

// the in-browser editor persists edits to localStorage — make sure a stale
// key on this machine can't leak into the export
await page.addInitScript(() => {
  try {
    localStorage.removeItem('habermolt-deck-edits-v1');
    localStorage.removeItem('habermolt-deck-edits-v2');
  } catch {}
});

await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
// live-navigation chrome doesn't belong in a static export
await page.addStyleTag({ content: '#deckCounter, .edit-hotzone, .edit-toggle { display: none !important; }' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const broken = await page.evaluate(() => [...document.images].filter(im => !im.naturalWidth).map(im => im.src));
if (broken.length) {
  console.error('  BROKEN IMAGES:', broken);
  await browser.close(); server.close(); process.exit(1);
}

const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
console.log(`  ${n} slides`);

mkdirSync(SHOT_DIR, { recursive: true });
const shots = [];
for (let i = 0; i < n; i++) {
  await page.evaluate(i => deck.show(i, true), i);   // true => reveal all .frag steps
  await page.waitForTimeout(850);                    // let .reveal entrance animations finish
  const p = join(SHOT_DIR, `s-${String(i + 1).padStart(3, '0')}.png`);
  await page.screenshot({ path: p });
  shots.push(p);
}
await browser.close();
server.close();

console.log('  assembling PDF...');
const b2 = await chromium.launch();
const pdfPage = await b2.newPage();
const pages = shots.map(p => `<div class="p"><img src="data:image/png;base64,${readFileSync(p).toString('base64')}"></div>`).join('\n');
await pdfPage.setContent(`<!DOCTYPE html><html><head><style>
*{margin:0;padding:0}@page{size:${W}px ${H}px;margin:0}
.p{width:${W}px;height:${H}px;page-break-after:always;overflow:hidden}
.p:last-child{page-break-after:auto}
img{width:${W}px;height:${H}px;display:block}
</style></head><body>${pages}</body></html>`, { waitUntil: 'load' });
await pdfPage.pdf({ path: OUTPUT_PDF, width: `${W}px`, height: `${H}px`, printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 } });
await b2.close();
shots.forEach(p => unlinkSync(p));
console.log(`  ✓ ${OUTPUT_PDF}`);
