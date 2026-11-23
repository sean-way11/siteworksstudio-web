'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkSite } = require('./browser-checks.cjs');

// https://developers.cloudflare.com/browser-run/script/
// No credentials are stored in the repository or emitted to logs.
async function main() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and a Browser Run Edit-scoped CLOUDFLARE_API_TOKEN');
  if (!/^[a-f0-9]{32}$/i.test(account)) throw new Error('Invalid Cloudflare account ID');
  const baseUrl = process.env.QA_BASE_URL || 'https://siteworksstudio.ru/';
  if (new URL(baseUrl).protocol !== 'https:') throw new Error('Cloud checks require an HTTPS site URL');
  const paths = ['index.html', 'portfolio.html', 'services.html', 'order.html', 'articles.html', '404.html'];
  const code = `async ({ page }) => { const checkSite = ${checkSite.toString()}; return checkSite({page, baseUrl:${JSON.stringify(baseUrl)}, paths:${JSON.stringify(paths)}}); }`;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering`;
  let sessionId;
  let closeError;
  let result;
  try {
    const response = await fetch(`${endpoint}/script?keep_alive=10000`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ library: 'playwright', timeout: 110000, code }), signal: AbortSignal.timeout(125000)
    });
    sessionId = response.headers.get('cf-browser-session-id');
    const payload = await response.json();
    if (!response.ok || payload.success !== true) {
      const retry = response.headers.get('retry-after');
      throw new Error(`Browser Run HTTP ${response.status}${retry ? '; retry after ' + retry + ' seconds' : ''}`);
    }
    result = payload.result;
  } finally {
    if (sessionId) {
      if (!/^[a-f0-9-]{36}$/i.test(sessionId)) throw new Error('Unexpected browser session ID');
      const closed = await fetch(`${endpoint}/devtools/browser/${sessionId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000)
      });
      if (!closed.ok && closed.status !== 404 && closed.status !== 410) closeError = `Close session HTTP ${closed.status}`;
    }
  }
  const output = path.resolve(__dirname, '../../../.qa-artifacts');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'cloud-report.json'), JSON.stringify({ ...result, closeError }, null, 2) + '\n');
  for (const c of result.checks) console.log(`${c.passed ? 'PASS' : 'FAIL'} ${c.name}${c.error ? ': ' + c.error : ''}`);
  if (!result.passed || closeError) { process.exitCode = 1; return; }
  // https://developers.cloudflare.com/browser-run/quick-actions/snapshot/
  // Use deterministic extraction, without Workers AI or additional AI credits.
  const snapshot = await fetch(`${endpoint}/snapshot`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: baseUrl, formats: ['pdf', 'links', 'scrape'],
      elements: [{ selector: 'h1' }], gotoOptions: { waitUntil: 'domcontentloaded', timeout: 20000 } }),
    signal: AbortSignal.timeout(60000)
  });
  const capture = await snapshot.json();
  if (!snapshot.ok || !capture.success || typeof capture.result?.pdf !== 'string') {
    throw new Error(`Snapshot capture failed: HTTP ${snapshot.status}`);
  }
  const pdf = Buffer.from(capture.result.pdf, 'base64');
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('Snapshot did not return a valid PDF');
  fs.writeFileSync(path.join(output, 'homepage.pdf'), pdf);
  fs.writeFileSync(path.join(output, 'page-extract.json'), JSON.stringify({
    links: capture.result.links, headings: capture.result.scrape
  }, null, 2) + '\n');
  console.log('PASS snapshot: PDF, links and headings captured in one request');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
