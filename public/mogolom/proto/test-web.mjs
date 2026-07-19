// End-to-end check of erd2.html: loads the page in headless Chrome, fails on
// console errors, runs an optimization, and screenshots before/after.
// Usage: node test-web.mjs [url]   (default http://127.0.0.1:8931/erd2.html)

import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://127.0.0.1:8931/erd2.html';
const shots = process.env.SHOT_DIR ?? '.';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1600,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });

const errors = [];
page.on('console', (msg) => {
  // resource failures are tracked via the response handler (with URLs); the
  // console duplicate of those has no URL, so skip it
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

await page.goto(url, { waitUntil: 'networkidle2' });

// Original diagram should render on load
await page.waitForSelector('#original-diagram svg', { timeout: 10000 });
await page.screenshot({ path: `${shots}/erd2-before.png` });

// Run optimization on the default example and wait for the optimized render
await page.click('#optimize-btn');
await page.waitForSelector('#optimized-diagram svg', { timeout: 60000 });
await page.waitForFunction(
  () => document.getElementById('status').textContent.startsWith('Done'),
  { timeout: 60000 }
);
await page.screenshot({ path: `${shots}/erd2-after.png` });

const report = async (label) => {
  console.log(`--- ${label}`);
  console.log('run-stats :', await page.$eval('#run-stats', (el) => el.textContent));
  console.log('original  :', await page.$eval('#original-score', (el) => el.textContent));
  console.log('optimized :', await page.$eval('#optimized-score', (el) => el.textContent));
};
await report('mogolom-example (exhaustive path)');

// Second phase: the big example goes through the greedy path with progress
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#examples-list button')];
  btns.find((b) => b.textContent === 'Mogolom Bonkers').click();
});
await page.click('#optimize-btn');
await page.waitForFunction(
  () => document.getElementById('status').textContent.startsWith('Done'),
  { timeout: 180000 }
);
await page.screenshot({ path: `${shots}/erd2-bonkers.png` });
await report('mogolom-bonkers (greedy path)');

console.log('console errors:', errors.length ? errors : 'none');

await browser.close();
if (errors.length) process.exit(1);
