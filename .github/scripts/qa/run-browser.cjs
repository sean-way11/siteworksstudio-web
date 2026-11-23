'use strict';
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { checkSite } = require('./browser-checks.cjs');

async function main() {
  const root = path.resolve(__dirname, '../../..');
  const output = path.join(root, '.qa-artifacts');
  fs.mkdirSync(output, { recursive: true });
  const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:8765/';
  let server;
  let browser;
  try {
    if (!process.env.QA_BASE_URL) {
      server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
      let startError;
      server.on('error', e => { startError = e; });
      let ready = false;
      for (let i = 0; i < 50; i++) {
        if (startError || server.exitCode !== null) throw startError || new Error('Local server exited');
        try { ready = (await fetch(baseUrl)).ok; } catch { /* server starting */ }
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!ready) throw new Error('Local site did not start');
    }
    browser = await chromium.launch({ headless: true, ...(process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {}) });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    const paths = execFileSync('git', ['ls-files', '*.html'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
    const report = await checkSite({ page, baseUrl, paths });
    fs.writeFileSync(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
    for (const c of report.checks) console.log(`${c.passed ? 'PASS' : 'FAIL'} ${c.name}${c.error ? ': ' + c.error : ''}`);
    console.log(`Intercepted lead attempts: ${report.interceptedLeadAttempts}; real orders sent: ${report.realLeadRequests}`);
    await context.close();
    if (!report.passed) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
