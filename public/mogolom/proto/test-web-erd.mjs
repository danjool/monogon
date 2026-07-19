// End-to-end check of erd.html after the Tier 1 engine swap (TRANSPLANT.md):
// loads the page in headless Chrome, fails on console errors, and verifies
//   - the default example renders and shows the predicted score,
//   - Optimize reaches 0 edge-edge / 0 edge-node in under a second,
//   - editing the textarea still live-renders,
//   - Stop cancels a long run and keeps the best found so far.
// Usage: node test-web-erd.mjs [url]   (default http://127.0.0.1:8931/erd.html)

import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://127.0.0.1:8931/erd.html';
const shots = process.env.SHOT_DIR ?? '.';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1600,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });

const errors = [];
const failures = [];
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
    errors.push(msg.text());
  }
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) {
    errors.push(`${res.status()} on ${res.url()}`);
  }
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

const expect = (cond, label) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`);
  if (!cond) failures.push(label);
};
const stat = (id) => page.$eval(`#${id}`, (el) => el.textContent.trim());

await page.goto(url, { waitUntil: 'networkidle2' });

// Default example renders on load, with its predicted score
await page.waitForSelector('#diagram svg', { timeout: 10000 });
expect((await stat('edge-edge-count')) === '3', 'initial predicted EE is 3 (mogolom-example)');
await page.screenshot({ path: `${shots}/erd1-before.png` });

// Optimize: 3 -> 0 EE, matching bench.mjs, in under a second
await page.click('#optimize-btn');
await page.waitForFunction(
  () => !document.getElementById('optimize-btn').disabled &&
        document.getElementById('method').textContent.includes('·'),
  { timeout: 30000 }
);
const method = await stat('method');
expect((await stat('edge-edge-count')) === '0', 'optimized EE is 0');
expect((await stat('edge-node-count')) === '0', 'optimized EN is 0');
expect((await stat('score')) === '0', 'weighted score is 0');
const secs = parseFloat(method.match(/([\d.]+)s/)?.[1] ?? 'NaN');
expect(secs < 1, `pipeline finished in under a second (${method})`);
await page.screenshot({ path: `${shots}/erd1-after.png` });

// Editing the textarea still live-renders (svg id changes with each render)
const svgIdBefore = await page.$eval('#diagram svg', (el) => el.id);
await page.evaluate(() => {
  const ed = document.getElementById('code-editor');
  ed.value += '\n    User ||--o{ Outcome : "observes"';
  ed.dispatchEvent(new Event('input'));
});
await page.waitForFunction(
  (prev) => document.querySelector('#diagram svg')?.id !== prev,
  { timeout: 10000 },
  svgIdBefore
);
expect(true, 'editing the textarea re-renders the diagram');

// Stop: start the long bonkers run, cancel it, keep best-so-far
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#examples-list button')];
  btns.find((b) => b.textContent === 'Mogolom Bonkers').click();
});
await page.click('#optimize-btn');
await new Promise((r) => setTimeout(r, 2000));
await page.click('#stop-btn');
await page.waitForFunction(
  () => !document.getElementById('optimize-btn').disabled,
  { timeout: 60000 }
);
expect((await stat('method')).includes('stopped early'), 'stop cancels and reports early stop');
const stoppedEE = parseInt(await stat('edge-edge-count'), 10);
expect(stoppedEE < 71, `stopped run kept an improvement (EE ${stoppedEE} < original 71)`);
await page.screenshot({ path: `${shots}/erd1-stopped.png` });

console.log('console errors:', errors.length ? errors : 'none');

await browser.close();
if (errors.length || failures.length) process.exit(1);
